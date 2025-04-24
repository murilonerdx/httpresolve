package com.murilo_pereira.httpresolve.strategy;



import com.murilo_pereira.httpresolve.config.BulkheadRateLimitProperties;
import com.murilo_pereira.httpresolve.exception.BulkheadException;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * Bulkhead implementation using a Semaphore and a queue
 */
public class SemaphoreBulkheadStrategy implements BulkheadStrategy {
	private final Semaphore semaphore;
	private final BlockingQueue<QueuedCall> queue;
	private final int maxConcurrentCalls;
	private final int maxQueueSize;
	private final long queueTimeoutMillis;

	private static class QueuedCall {
		final long timestamp;

		QueuedCall() {
			this.timestamp = System.currentTimeMillis();
		}
	}

	public SemaphoreBulkheadStrategy(BulkheadRateLimitProperties.BulkheadConfig config) {
		this.maxConcurrentCalls = config.getMaxConcurrentCalls();
		this.maxQueueSize = config.getMaxQueueSize();
		this.queueTimeoutMillis = config.getQueueTimeout().toMillis();

		this.semaphore = new Semaphore(maxConcurrentCalls, true);
		this.queue = maxQueueSize > 0 ? new ArrayBlockingQueue<>(maxQueueSize) : null;
	}

	@Override
	public void acquirePermission() throws BulkheadException {
		boolean permitted = false;

		try {
			// Try direct acquire first
			permitted = semaphore.tryAcquire();

			// If not permitted and queue is available, try queueing
			if (!permitted && queue != null) {
				QueuedCall call = new QueuedCall();

				// Try to enqueue
				if (!queue.offer(call)) {
					throw new BulkheadException("Bulkhead queue is full");
				}

				try {
					// Wait for a permit to become available
					permitted = semaphore.tryAcquire(queueTimeoutMillis, TimeUnit.MILLISECONDS);

					if (!permitted) {
						// Remove from queue if timed out
						queue.remove(call);
						throw new BulkheadException("Bulkhead queue wait timeout exceeded");
					}
				} finally {
					// Remove from queue regardless
					queue.remove(call);
				}
			} else if (!permitted) {
				throw new BulkheadException("Bulkhead capacity full and queueing not enabled");
			}
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			throw new BulkheadException("Thread was interrupted while waiting for bulkhead", e);
		}
	}

	@Override
	public void releasePermission() {
		semaphore.release();
	}

	@Override
	public BulkheadMetrics getMetrics() {
		int queueSize = queue != null ? queue.size() : 0;
		int queueCapacity = queue != null ? queue.remainingCapacity() + queueSize : 0;

		return new BulkheadMetrics(
				semaphore.availablePermits(),
				maxConcurrentCalls,
				queueSize,
				queueCapacity
		);
	}
}
