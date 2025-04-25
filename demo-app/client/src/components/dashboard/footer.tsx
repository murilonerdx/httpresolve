import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200 py-4">
      <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
        <p>ResilientAPI Tester &copy; {currentYear} - Testing tool for Spring Boot Resilience4j</p>
      </div>
    </footer>
  );
}
