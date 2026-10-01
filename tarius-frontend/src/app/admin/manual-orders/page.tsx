// Filename: src/app/admin/manual-orders/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminManualOrders() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  // Update State
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const defaultFormData = {
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    product_selection: 'Spirulina Reserve (50g)',
    quantity: 1,
    total_value: '',
    payment_status: 'Pending',
    order_status: 'Processing',
    internal_notes: ''
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('DirectOrders')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
    }
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');

    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    let error;

    if (editingId) {
      // Update existing record
      const { error: updateError } = await supabaseAuth
        .from('DirectOrders')
        .update(formData)
        .eq('id', editingId);
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabaseAuth
        .from('DirectOrders')
        .insert([formData]);
      error = insertError;
    }

    setIsSubmitting(false);

    if (error) {
      alert("Failed to save customer order. Please check database permissions.");
      console.error(error);
    } else {
      setSuccessMsg(editingId ? "Order updated successfully." : "Customer order added successfully.");
      
      setFormData(defaultFormData);
      setEditingId(null);
      fetchOrders();

      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const handleEdit = (order: any) => {
    setEditingId(order.id);
    setFormData({
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      customer_phone: order.customer_phone || '',
      shipping_address: order.shipping_address || '',
      product_selection: order.product_selection || 'Spirulina Reserve (50g)',
      quantity: order.quantity || 1,
      total_value: order.total_value || '',
      payment_status: order.payment_status || 'Pending',
      order_status: order.order_status || 'Processing',
      internal_notes: order.internal_notes || ''
    });
    
    // Smooth scroll to the top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleDelete = async (id: string, customerName: string) => {
    if (!window.confirm("Are you sure you want to permanently delete the order for " + customerName + "?")) return;

    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const { error } = await supabaseAuth.from('DirectOrders').delete().eq('id', id);

    if (error) {
      alert("Failed to delete order.");
      console.error(error);
    } else {
      setOrders(prev => prev.filter(order => order.id !== id));
    }
  };

  // Derive filtered list
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesPayment = paymentFilter === 'All' || order.payment_status === paymentFilter;
    const matchesStatus = statusFilter === 'All' || order.order_status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const inputBaseStyle = "bg-transparent border-b border-[var(--tarius-border)] outline-none focus:border-[var(--tarius-olive)] transition-colors py-3 text-sm text-[var(--tarius-graphite)] w-full placeholder-stone-300";
  const filterSelectStyle = "bg-transparent border-b border-[var(--tarius-border)] py-2 px-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] cursor-pointer";

  return (
    <div className="min-h-screen bg-[var(--tarius-ivory)] font-body pb-32">
      
      <div className="sticky top-0 z-[100] bg-white border-b border-[var(--tarius-border)] shadow-sm px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--tarius-graphite)] leading-none mb-1">Customer Orders</h1>
          <p className="text-[9px] uppercase tracking-widest text-stone-400">Manual Order Management</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {successMsg && (
            <span className="text-[9px] uppercase tracking-widest text-[var(--tarius-olive)] font-bold animate-pulse">
              {successMsg}
            </span>
          )}
          {editingId && (
            <button 
              onClick={handleCancelEdit}
              className="px-4 py-3 bg-transparent text-stone-500 text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Cancel Edit
            </button>
          )}
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full sm:w-auto px-8 py-3 bg-[var(--tarius-olive)] text-white text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-graphite)] transition-colors disabled:opacity-50 rounded-sm shadow-md"
          >
            {isSubmitting ? 'Saving...' : (editingId ? 'Update Order' : 'Save Order')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-16">
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className={"bg-white border shadow-sm p-8 sm:p-10 transition-colors " + (editingId ? "border-[var(--tarius-olive)] shadow-md" : "border-[var(--tarius-border)]")}>
            <div className="flex items-center justify-between border-b border-[var(--tarius-border)] pb-4 mb-6">
              <h2 className="font-display text-2xl text-[var(--tarius-graphite)]">
                {editingId ? "Edit Customer Order" : "Add New Customer"}
              </h2>
              {editingId && <span className="text-[9px] uppercase tracking-widest bg-[var(--tarius-olive)]/10 text-[var(--tarius-olive)] px-3 py-1 font-bold">Edit Mode Active</span>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Full Name *</label>
                <input 
                  type="text" 
                  name="customer_name"
                  required
                  value={formData.customer_name} 
                  onChange={handleChange}
                  className={inputBaseStyle}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Email Address</label>
                <input 
                  type="email" 
                  name="customer_email"
                  value={formData.customer_email} 
                  onChange={handleChange}
                  className={inputBaseStyle}
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="customer_phone"
                  value={formData.customer_phone} 
                  onChange={handleChange}
                  className={inputBaseStyle}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Shipping Address</label>
                <textarea 
                  name="shipping_address"
                  rows={2}
                  value={formData.shipping_address} 
                  onChange={handleChange}
                  className={"resize-none " + inputBaseStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="md:col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Product</label>
                <select 
                  name="product_selection"
                  value={formData.product_selection} 
                  onChange={handleChange}
                  className="w-full bg-transparent border border-[var(--tarius-border)] py-3 px-4 text-sm focus:outline-none focus:border-[var(--tarius-olive)]"
                >
                  <option value="Spirulina Reserve (50g)">Spirulina Reserve (50g)</option>
                  <option value="Spirulina Reserve (100g)">Spirulina Reserve (100g)</option>
                  <option value="Wild Botanical Moringa (50g)">Wild Botanical Moringa (50g)</option>
                  <option value="Dual Allocation (Both Reserves)">Dual Allocation (Both Reserves)</option>
                  <option value="Custom Order">Custom Order</option>
                </select>
              </div>
              
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Quantity</label>
                <input 
                  type="number" 
                  name="quantity"
                  min="1"
                  value={formData.quantity} 
                  onChange={handleChange}
                  className={inputBaseStyle}
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Total Price</label>
                <input 
                  type="text" 
                  name="total_value"
                  placeholder="e.g. 150.00"
                  value={formData.total_value} 
                  onChange={handleChange}
                  className={inputBaseStyle}
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Payment</label>
                <select 
                  name="payment_status"
                  value={formData.payment_status} 
                  onChange={handleChange}
                  className="w-full bg-transparent border border-[var(--tarius-border)] py-3 px-4 text-sm focus:outline-none focus:border-[var(--tarius-olive)]"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Complimentary">Complimentary</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Order Status</label>
                <select 
                  name="order_status"
                  value={formData.order_status} 
                  onChange={handleChange}
                  className="w-full bg-transparent border border-[var(--tarius-border)] py-3 px-4 text-sm focus:outline-none focus:border-[var(--tarius-olive)]"
                >
                  <option value="Processing">Processing</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Internal Notes</label>
              <textarea 
                name="internal_notes"
                rows={2}
                placeholder="Any private notes about this customer..."
                value={formData.internal_notes} 
                onChange={handleChange}
                className={"resize-none " + inputBaseStyle}
              />
            </div>
          </div>
        </form>

        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <h2 className="font-display text-2xl text-[var(--tarius-graphite)]">Customer Database</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 border border-[var(--tarius-border)] shadow-sm">
              <input 
                type="text" 
                placeholder="Search name, email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-b border-[var(--tarius-border)] py-2 px-3 text-xs w-full sm:w-48 focus:outline-none focus:border-[var(--tarius-olive)] placeholder-stone-400"
              />
              
              <div className="w-full sm:w-auto h-px sm:h-6 sm:w-px bg-[var(--tarius-border)]"></div>
              
              <select 
                value={paymentFilter} 
                onChange={(e) => setPaymentFilter(e.target.value)}
                className={filterSelectStyle}
              >
                <option value="All">All Payments</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Complimentary">Complimentary</option>
              </select>
              
              <div className="w-full sm:w-auto h-px sm:h-6 sm:w-px bg-[var(--tarius-border)]"></div>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className={filterSelectStyle}
              >
                <option value="All">All Statuses</option>
                <option value="Processing">Processing</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="py-12 text-center text-[var(--tarius-graphite-soft)] font-light text-xs uppercase animate-pulse border border-[var(--tarius-border)] bg-white/50">
              Loading Customers...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 font-light border border-dashed border-[var(--tarius-border)] bg-white/50 text-sm">
              No matching orders found.
            </div>
          ) : (
            <div className="bg-white border border-[var(--tarius-border)] shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--tarius-ivory-deep)] border-b border-[var(--tarius-border)] text-[9px] uppercase tracking-widest text-stone-500">
                  <tr>
                    <th className="px-6 py-4 font-normal">Date</th>
                    <th className="px-6 py-4 font-normal">Customer</th>
                    <th className="px-6 py-4 font-normal">Product</th>
                    <th className="px-6 py-4 font-normal">Price</th>
                    <th className="px-6 py-4 font-normal">Payment</th>
                    <th className="px-6 py-4 font-normal">Status</th>
                    <th className="px-6 py-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--tarius-border)] text-stone-600">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50 transition-colors group">
                      <td className="px-6 py-4 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="block font-medium text-[var(--tarius-graphite)]">{order.customer_name}</span>
                        <span className="block text-xs text-stone-400">{order.customer_email || order.customer_phone || 'No contact provided'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="block truncate max-w-[200px]">{order.product_selection}</span>
                        <span className="text-stone-400">Qty: {order.quantity}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[var(--tarius-graphite)]">
                        {order.total_value || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={"inline-flex items-center px-2 py-1 text-[9px] uppercase tracking-widest " + 
                          (order.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : 
                           order.payment_status === 'Complimentary' ? 'bg-stone-200 text-stone-600' : 
                           'bg-yellow-100 text-yellow-700')}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={"inline-flex items-center px-2 py-1 text-[9px] uppercase tracking-widest " + 
                          (order.order_status === 'Delivered' ? 'bg-[var(--tarius-olive)] text-white' : 
                           order.order_status === 'Dispatched' ? 'bg-blue-100 text-blue-700' : 
                           'bg-[var(--tarius-ivory-deep)] text-stone-600')}
                        >
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleEdit(order)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-stone-400 hover:text-[var(--tarius-olive)] hover:bg-[var(--tarius-olive)]/10 transition-colors opacity-50 group-hover:opacity-100"
                          title="Edit Customer Order"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => handleDelete(order.id, order.customer_name)}
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-50 group-hover:opacity-100"
                          title="Delete Customer Order"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}