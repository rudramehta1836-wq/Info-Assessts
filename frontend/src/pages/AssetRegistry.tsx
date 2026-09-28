import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowRight, Download } from 'lucide-react';
import CreateAssetModal from '../components/CreateAssetModal';
import classNames from 'classnames';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AssetRegistry() {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStatus, setActiveStatus] = useState('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    api.get('/assets').then(res => setAssets(res.data));
  }, []);

  const filtered = assets.filter(a => {
    const matchesSearch = a.id.toLowerCase().includes(search.toLowerCase()) || a.ward.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || a.category === activeCategory;
    const matchesStatus = activeStatus === 'All' || a.status === activeStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }).reverse();

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('CityWorks Asset Registry Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const tableData = filtered.map(a => [
      a.id, 
      a.category, 
      a.ward, 
      a.condition_score.toString() + '/5', 
      a.status,
      `$${a.cost.toLocaleString()}`
    ]);
    
    autoTable(doc, {
      head: [['ID', 'Category', 'Ward', 'Condition', 'Status', 'Cost']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // indigo-600
    });
    
    doc.save('asset-registry-report.pdf');
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'In Service': 
      case 'Commissioned': return { text: 'Operational', cls: 'bg-green-50 text-green-700 border-green-200' };
      case 'Under Maintenance': return { text: 'Under Maint.', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'Decommissioned':
      case 'Disposed': return { text: 'Out of Service', cls: 'bg-red-50 text-red-700 border-red-200' };
      default: return { text: status, cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const getConditionDisplay = (score: number) => {
    if (score === 5) return { text: 'Excellent (95)', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (score === 4) return { text: 'Good (82)', cls: 'bg-teal-50 text-teal-700 border-teal-200' };
    if (score === 3) return { text: 'Fair (68)', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { text: 'Critical (24)', cls: 'bg-red-50 text-red-700 border-red-200' };
  };

  const getCriticalityDisplay = (crit: number) => {
    if (crit === 5) return { text: 'CRITICAL', cls: 'bg-slate-100 text-slate-700 uppercase tracking-widest text-[10px]' };
    if (crit === 4) return { text: 'HIGH', cls: 'bg-orange-100 text-orange-700 uppercase tracking-widest text-[10px]' };
    if (crit === 3) return { text: 'MEDIUM', cls: 'bg-yellow-100 text-yellow-700 uppercase tracking-widest text-[10px]' };
    return { text: 'LOW', cls: 'bg-slate-100 text-slate-600 uppercase tracking-widest text-[10px]' };
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedAssets = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Registry</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all municipal infrastructure</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportPDF} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + Register Asset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID or Ward..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <select 
            value={activeCategory} 
            onChange={e => { setActiveCategory(e.target.value); setCurrentPage(1); }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 outline-none cursor-pointer bg-white appearance-none min-w-[140px]"
          >
            <option value="All">All Categories</option>
            {Array.from(new Set(assets.map(a => a.category))).map((c: any) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select 
            value={activeStatus} 
            onChange={e => { setActiveStatus(e.target.value); setCurrentPage(1); }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 outline-none cursor-pointer bg-white appearance-none min-w-[140px]"
          >
            <option value="All">All Statuses</option>
            {Array.from(new Set(assets.map(a => a.status))).map((s: any) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {paginatedAssets.map(asset => {
            const statusNode = getStatusDisplay(asset.status);
            const conditionNode = getConditionDisplay(asset.condition_score);
            const critNode = getCriticalityDisplay(asset.criticality);
            
            // Format title and department mapping loosely based on category
            const title = `${asset.ward} Urban ${asset.category}`;
            let deptStr = "Municipal Corporation";
            let deptCode = "AMC-GEN";
            if (asset.category.includes('Road') || asset.category.includes('Bridge') || asset.category.includes('Streetlight')) {
              deptStr = "Public Works Department (Road & Building)";
              deptCode = "AMC-PWD";
            } else if (asset.category.includes('Water') || asset.category.includes('Sewer')) {
              deptStr = "Water & Sewage Management";
              deptCode = "AMC-WSM";
            } else if (asset.category.includes('Signal')) {
              deptStr = "Traffic Police / Transport";
              deptCode = "AMC-TPT";
            }

            return (
              <div key={asset.id} className="p-4 hover:bg-slate-50/50 transition-colors grid grid-cols-12 gap-4 items-center">
                
                {/* Description Column */}
                <div className="col-span-12 lg:col-span-3">
                  <p className="font-bold text-slate-900 text-[15px] leading-tight mb-1">{title}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide truncate max-w-[200px] xl:max-w-sm">
                    {asset.category.toUpperCase()} • {asset.description ? asset.description : 'General Infrastructure'}
                  </p>
                </div>
                
                {/* ID Column */}
                <div className="col-span-6 md:col-span-4 lg:col-span-1 flex items-center">
                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono font-medium text-slate-700 whitespace-nowrap">{asset.id}</span>
                </div>

                {/* Department Column */}
                <div className="col-span-6 md:col-span-4 lg:col-span-2">
                  <p className="text-[13px] text-slate-800 font-medium leading-snug truncate">{deptStr}</p>
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{deptCode}</p>
                </div>

                {/* Status Column */}
                <div className="col-span-6 md:col-span-4 lg:col-span-1 flex justify-start lg:justify-center">
                  <span className={classNames("px-2.5 py-1 rounded border text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5", statusNode.cls)}>
                    <div className={classNames("w-1.5 h-1.5 rounded-full", statusNode.cls.split(' ')[0].replace('bg-', 'bg-').replace('50', '500'))} />
                    {statusNode.text}
                  </span>
                </div>

                {/* Condition Column */}
                <div className="col-span-6 md:col-span-4 lg:col-span-2 flex justify-start lg:justify-center">
                  <span className={classNames("px-2.5 py-1 rounded border text-xs font-bold whitespace-nowrap inline-flex items-center gap-1.5", conditionNode.cls)}>
                    <div className={classNames("w-1.5 h-1.5 rounded-full", conditionNode.cls.split(' ')[0].replace('bg-', 'bg-').replace('50', '500'))} />
                    {conditionNode.text}
                  </span>
                </div>

                {/* Criticality Column */}
                <div className="col-span-6 md:col-span-4 lg:col-span-1 flex justify-start lg:justify-center">
                  <span className={classNames("px-2 py-1 rounded font-bold whitespace-nowrap inline-block text-[10px]", critNode.cls)}>
                    {critNode.text}
                  </span>
                </div>

                {/* Location Column */}
                <div className="col-span-6 md:col-span-4 lg:col-span-1">
                  <p className="text-[13px] text-slate-800 font-medium whitespace-nowrap">{asset.ward} Ward</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 leading-tight tracking-tighter whitespace-nowrap">
                    {asset.lat.toFixed(4)}° N,<br/>{asset.lng.toFixed(4)}° E
                  </p>
                </div>

                {/* Action Column */}
                <div className="col-span-12 md:col-span-4 lg:col-span-1 flex justify-end">
                  <Link to={`/assets/${asset.id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm inline-block whitespace-nowrap">
                    View
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-slate-100 p-4 bg-white flex justify-between items-center text-sm text-slate-600 font-medium">
          <div>
            Showing page {currentPage} of {totalPages || 1} ({filtered.length} total assets)
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 hover:text-indigo-600 disabled:text-slate-300 transition-colors"
            >
              &lt; Previous
            </button>
            <span className="text-slate-800 font-bold">{currentPage} / {totalPages || 1}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="flex items-center gap-1 hover:text-indigo-600 disabled:text-slate-300 transition-colors"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>

      <CreateAssetModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={() => {
          api.get('/assets').then(res => setAssets(res.data));
        }}
        userRole={user.role}
      />
    </div>
  );
}
