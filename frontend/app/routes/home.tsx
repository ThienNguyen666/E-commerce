import React from "react";
import { Link } from "react-router";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="bg-gradient-to-r from-blue-700 to-cyan-600 rounded-2xl p-8 md:p-12 text-white shadow-lg">
        <p className="text-sm uppercase tracking-wider mb-2">E-commerce Platform</p>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">Shop smarter, faster, and with full backend integration</h1>
        <p className="text-blue-100 max-w-2xl mb-6">
          Browse products, manage cart, place orders, apply vouchers, review items, and view sales analytics from one unified flow.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/products" className="bg-white text-blue-700 px-5 py-2.5 rounded font-semibold hover:bg-blue-50">
            Browse Products
          </Link>
          <Link to="/login" className="border border-white px-5 py-2.5 rounded font-semibold hover:bg-white/10">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
