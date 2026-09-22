'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useVehicleStore } from '@/store/VehicleStore'
import type { Country } from '@prisma/client'

const CURRENCIES: Record<Country, string> = {
  SG: 'SGD',
  MY: 'MYR',
  ID: 'IDR',
  TH: 'THB',
  VN: 'VND',
  PH: 'PHP',
}

type CorrectionType = 'ev' | 'bess'
type FieldType = 'price' | 'specs' | 'features' | 'other'

interface CorrectionForm {
  type: CorrectionType
  country: Country | ''
  vehicleName: string
  field: string
  currentValue: string
  suggestedValue: string
  source: string
  email: string
  notes: string
}

export default function SuggestCorrectionClient() {
  const { vehicles } = useVehicleStore()
  const [form, setForm] = useState<CorrectionForm>({
    type: 'ev',
    country: '',
    vehicleName: '',
    field: '',
    currentValue: '',
    suggestedValue: '',
    source: '',
    email: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/suggest-correction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Failed to submit correction. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting correction:', error)
      alert('Failed to submit correction. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateForm = (field: keyof CorrectionForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Correction received</h3>
        <p className="text-gray-600 mb-6">
          Your correction suggestion has been submitted. We&apos;ll review it within 24-48 hours and update our data if verified.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/ev"
            className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to EV comparison
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Correction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to correct?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                name="type"
                value="ev"
                checked={form.type === 'ev'}
                onChange={(e) => updateForm('type', e.target.value as CorrectionType)}
                className="sr-only peer"
              />
              <div className="p-4 border border-gray-200 rounded-lg cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:bg-gray-50">
                <div className="font-medium text-gray-900">Electric Vehicle</div>
                <div className="text-sm text-gray-500">Specs, pricing, features</div>
              </div>
            </label>
            <label className="relative">
              <input
                type="radio"
                name="type"
                value="bess"
                checked={form.type === 'bess'}
                onChange={(e) => updateForm('type', e.target.value as CorrectionType)}
                className="sr-only peer"
              />
              <div className="p-4 border border-gray-200 rounded-lg cursor-pointer peer-checked:border-emerald-500 peer-checked:bg-emerald-50 hover:bg-gray-50">
                <div className="font-medium text-gray-900">Battery Storage</div>
                <div className="text-sm text-gray-500">BESS products, pricing</div>
              </div>
            </label>
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={form.country}
            onChange={(e) => updateForm('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          >
            <option value="">Select country</option>
            <option value="SG">Singapore</option>
            <option value="MY">Malaysia</option>
            <option value="ID">Indonesia</option>
            <option value="TH">Thailand</option>
            <option value="VN">Vietnam</option>
            <option value="PH">Philippines</option>
          </select>
        </div>

        {/* Vehicle/Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {form.type === 'ev' ? 'Vehicle Name' : 'Product Name'}
          </label>
          <input
            type="text"
            value={form.vehicleName}
            onChange={(e) => updateForm('vehicleName', e.target.value)}
            placeholder={form.type === 'ev' ? 'e.g., Tesla Model 3 Long Range' : 'e.g., BYD B-Box 10.2'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>

        {/* Field to Correct */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What field needs correction?
          </label>
          <input
            type="text"
            value={form.field}
            onChange={(e) => updateForm('field', e.target.value)}
            placeholder="e.g., Battery capacity, Price, Range, Power"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            required
          />
        </div>

        {/* Current vs Suggested Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Value
            </label>
            <input
              type="text"
              value={form.currentValue}
              onChange={(e) => updateForm('currentValue', e.target.value)}
              placeholder="What's currently shown"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suggested Value
            </label>
            <input
              type="text"
              value={form.suggestedValue}
              onChange={(e) => updateForm('suggestedValue', e.target.value)}
              placeholder="What it should be"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source URL (optional)
          </label>
          <input
            type="url"
            value={form.source}
            onChange={(e) => updateForm('source', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Link to official specs, dealer website, or news article
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (optional)
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            We&apos;ll only contact you if we need clarification
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => updateForm('notes', e.target.value)}
            rows={3}
            placeholder="Any additional context or explanation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Correction'}
          </button>
        </div>
      </form>
    </div>
  )
}