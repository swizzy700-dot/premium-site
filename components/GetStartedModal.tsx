'use client';

import { useState } from 'react';
import Modal from './Modal';

interface GetStartedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GetStartedModal({ isOpen, onClose }: GetStartedModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [project, setProject] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Get Started:', { name, email, project });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-light text-neutral-950">
            Start Your Project
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-light text-neutral-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-light text-neutral-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="project" className="block text-sm font-light text-neutral-700 mb-2">
              Project Type
            </label>
            <select
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            >
              <option value="">Select a service</option>
              <option value="web-development">Web Development</option>
              <option value="e-commerce">E-Commerce</option>
              <option value="branding">Branding & Design</option>
              <option value="consultation">Consultation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 text-neutral-950 px-6 py-3 rounded-full font-light tracking-[0.25em] uppercase transition-all duration-300 hover:bg-amber-400"
          >
            Get Started
          </button>
        </form>
      </div>
    </Modal>
  );
}
