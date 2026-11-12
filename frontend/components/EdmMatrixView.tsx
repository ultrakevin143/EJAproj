'use client';

import React from 'react';
import { Network, Database, ShieldCheck, ArrowRight, Layers, FileSpreadsheet } from 'lucide-react';

export default function EdmMatrixView() {
  const industries = [
    {
      industry: '🏋️ Fitness & Gym Member Health Screening (Our Project)',
      isHighlight: true,
      dataSources: 'Front-desk POS, Mobile App (PAR-Q self-declaration), Heart-Rate IoT Wearables, Trainer Clinic Referrals',
      integrationMethods: 'REST APIs (Real-time checks), Batch ETL (Nightly sanitization), CDC / Webhooks (Facility gate block on Flagged)',
      governanceNeeds: 'Health privacy consent, ISO-8601 dates, Controlled screening vocab (Cleared/Flagged/Pending), Zero Hallucination Rule',
      outputs: 'Member 360° Safety Profile, Trainer Access Gate Control, DQM Executive Compliance Dashboard, Sanitized Analytics'
    },
    {
      industry: '🏥 Healthcare / Medical Laboratory (Slide 11 & 18)',
      isHighlight: false,
      dataSources: 'Electronic Medical Records (EMR), Lab Information System (LIS), Billing, Health Insurance',
      integrationMethods: 'Change Data Capture (CDC), Batch ETL / ELT, FHIR / HL7 REST APIs',
      governanceNeeds: 'HIPAA, ISO 15189, Role-based clinician access, Audit trails',
      outputs: 'Patient 360°, Secure Lab Result Delivery, Regulatory Compliance Reports'
    },
    {
      industry: '🏦 Banking & Finance (Slide 15 & 18)',
      isHighlight: false,
      dataSources: 'Core Banking System, Loan Management, CRM, Mobile Apps, Regulatory Reporting Tools',
      integrationMethods: 'REST APIs, Data Fabric, Batch ETL, Real-time Event Streaming',
      governanceNeeds: 'Basel III, AML (Anti-Money Laundering), Immutable Audit Logs',
      outputs: 'Unified Customer Profile, Real-time Fraud Detection, Regulatory Disclosures'
    },
    {
      industry: '🛒 Retail & E-Commerce (Slide 16 & 18)',
      isHighlight: false,
      dataSources: 'Point of Sale (POS), Inventory Warehouse, CRM, Online Storefronts, 3PL Logistics',
      integrationMethods: 'Real-time APIs, Change Data Capture (CDC), Data Virtualization',
      governanceNeeds: 'PCI DSS, GDPR, Consumer Privacy Controls',
      outputs: 'Omnichannel Stock Sync, Personalized Offers, Unified Sales Analytics'
    },
    {
      industry: '🏭 Manufacturing (Slide 16 & 18)',
      isHighlight: false,
      dataSources: 'ERP, Supply Chain Management, Factory IoT Sensors, Quality Control Systems, HR',
      integrationMethods: 'IoT Streaming (MQTT/Kafka), Batch ETL, Industrial APIs',
      governanceNeeds: 'ISO 9001, Industrial Workplace Safety Standards',
      outputs: 'Predictive Equipment Maintenance, Supply Chain Optimization, Production KPI Reports'
    },
    {
      industry: '🎓 Education & Universities (Slide 17 & 18)',
      isHighlight: false,
      dataSources: 'Student Information System (SIS), Learning Management System (LMS), HR/Payroll, Library, Alumni CRM',
      integrationMethods: 'ETL / ELT, REST APIs, Hybrid Data Fabric',
      governanceNeeds: 'FERPA, GDPR, Student Data Privacy Regulations',
      outputs: 'Unified Student Lifecycle View, Academic Retention Analytics, Alumni Tracking'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
        <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2.5 py-1 rounded border border-blue-500/30">
          Tab 8 • Enterprise Data Management (EDM) Integration Matrix
        </span>
        <h1 className="text-2xl font-bold mt-2">EDM Integration Across Industries</h1>
        <p className="text-blue-100 text-xs mt-1 max-w-2xl">
          Based on <code>integration.pptx</code> (Slides 15–19). This matrix maps the 4 pillars of enterprise data management:
          <strong> Data Sources → Integration Methods → Governance Needs → Outputs</strong>, demonstrating how EDM principles apply
          universally across industries.
        </p>
      </div>

      {/* 4 Pillars Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: '1. Data Sources', desc: 'Siloed intake apps, forms, databases, and IoT devices requiring extraction.', icon: Database, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { title: '2. Integration Methods', desc: 'ETL, ELT, REST APIs, CDC, and Data Virtualization pipelines.', icon: Network, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { title: '3. Data Governance', desc: 'Compliance policies, schema rules, role-based access, and audit trails.', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { title: '4. Enterprise Outputs', desc: 'Unified 360° profiles, dashboards, real-time alerts, and BI reporting.', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl border ${item.color} shadow-sm space-y-2`}>
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <h3 className="font-bold text-xs text-slate-800">{item.title}</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Comparative Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <h2 className="font-bold text-xs text-slate-800">
              Comparative EDM Integration Matrix (Slide 18 & 19 Alignment)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            6 Industries Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-1/5">Industry Domain</th>
                <th className="py-3 px-4 w-1/5">Data Sources</th>
                <th className="py-3 px-4 w-1/5">Integration Methods</th>
                <th className="py-3 px-4 w-1/5">Governance Needs</th>
                <th className="py-3 px-4 w-1/5">Enterprise Outputs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {industries.map((ind, i) => (
                <tr
                  key={i}
                  className={`transition ${
                    ind.isHighlight
                      ? 'bg-emerald-50/50 hover:bg-emerald-50 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {ind.industry}
                    {ind.isHighlight && (
                      <span className="block mt-1 text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full w-max">
                        Active Project
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">
                    {ind.dataSources}
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed font-mono text-[11px]">
                    {ind.integrationMethods}
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-relaxed">
                    {ind.governanceNeeds}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium leading-relaxed">
                    {ind.outputs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

