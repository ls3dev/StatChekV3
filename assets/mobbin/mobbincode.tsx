import { Bell, ChevronRight, Info, Plus, Settings } from 'lucide-react';
import React from 'react';

export default function FinancialDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-pink-600 to-pink-700 px-4 pt-12 pb-8 rounded-b-3xl">
        <div className="flex justify-between items-center text-white mb-4">
          <Settings size={24} />
          <span className="text-lg font-medium">Mon, Oct 6</span>
          <Bell size={24} />
        </div>
      </div>

      {/* Spending Card */}
      <div className="px-4 -mt-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
          <p className="text-gray-600 text-sm mb-2">Current spend this month</p>
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-5xl font-bold">$262</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                <span className="text-green-500 text-sm">✓</span>
              </div>
              <div className="text-right text-sm">
                <div>$472 below</div>
                <div>last month</div>
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="relative h-32 mb-6">
            <svg className="w-full h-full" viewBox="0 0 600 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M 0 80 Q 150 60 300 40 T 600 50 L 600 120 L 0 120 Z"
                fill="url(#gradient)"
              />
              <path
                d="M 0 80 Q 150 60 300 40 T 600 50"
                fill="none"
                stroke="#60A5FA"
                strokeWidth="3"
              />
              <circle cx="300" cy="40" r="8" fill="white" stroke="#60A5FA" strokeWidth="3" />
            </svg>
          </div>

          {/* View Spending Button */}
          <button className="w-full flex items-center justify-between py-3 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <span className="font-semibold text-lg">View Spending</span>
            </div>
            <ChevronRight size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-black"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        </div>

        {/* Accounts Section */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm tracking-wide">ACCOUNTS</h2>
          <button className="font-semibold underline">Add Account</button>
        </div>

        {/* Account Cards */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden mb-4">
          <AccountItem icon="🏛️" label="Checking" amount="$697" hasDropdown />
          <AccountItem icon="💳" label="Card Balance" amount="$394" hasDropdown />
          <AccountItem icon="💵" label="Net Cash" amount="$303" positive hasInfo />
        </div>

        <div className="bg-white rounded-3xl shadow-md overflow-hidden mb-4">
          <AccountItem icon="🐷" label="Savings" action="Start" hasAdd />
          <AccountItem icon="📊" label="Investments" action="Add" hasAdd purple />
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-8">
          <span className="text-lg">🔄</span>
          <span>5 minutes ago | <button className="font-semibold underline">Sync now</button></span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavItem icon="📊" label="Dashboard" active />
          <NavItem icon="📅" label="Recurring" />
          <NavItem icon="💰" label="Spending" />
          <NavItem icon="🔍" label="Transactions" />
          <NavItem icon="☰" label="More" />
        </div>
      </nav>
    </div>
  );
}

function AccountItem({ icon, label, amount, action, hasDropdown, hasInfo, hasAdd, positive, purple }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-2xl">
          {icon}
        </div>
        <span className="font-medium text-lg">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {amount && (
          <span className={`font-semibold text-lg ${positive ? 'text-green-600' : ''}`}>
            {amount}
          </span>
        )}
        {action && (
          <span className={`font-semibold ${purple ? 'text-purple-600' : 'text-purple-600'}`}>
            {action}
          </span>
        )}
        {hasDropdown && <ChevronRight size={20} className="text-gray-400 rotate-90" />}
        {hasInfo && <Info size={20} className="text-gray-400" />}
        {hasAdd && <Plus size={20} className="text-gray-400" />}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button className="flex flex-col items-center gap-1 py-2">
      <span className="text-xl">{icon}</span>
      <span className={`text-xs ${active ? 'text-pink-600 font-semibold' : 'text-gray-600'}`}>
        {label}
      </span>
    </button>
  );
}