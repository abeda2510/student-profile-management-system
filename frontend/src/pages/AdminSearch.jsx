import React, { useState, useEffect } from 'react';
import api, { viewUrl } from '../api';
import { ViewButton } from '../components/PreviewModal';



export default function AdminSearch() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');

  // Modal states for certifications/publications list
  const [modalType, setModalType] = useState(null); // 'certifications' | 'publications'
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  const handleCardClick = async (type) => {
    setModalType(type);
    setModalLoading(true);
    try {
      const { data } = await api.get('/achievements/faculty-report?status=APPROVED');
      setModalData(data);
    } catch (err) {
      console.error(err);
    }
    setModalLoading(false);
  };

  // Fetch aggregated statistics
  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/students/dashboard-stats');
      setStats(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics. Please verify you are logged in as admin.');
    }
    setLoading(false);
  };



  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    await fetchStats();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div className="spinner" style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 1s linear infinite' }} />
        <span style={{ color: '#64748b', fontWeight: 600, fontSize: 15 }}>Analyzing university database...</span>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: '36px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #fee2e2', textAlign: 'center', maxWidth: 500, margin: '40px auto' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: '#991b1b', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Access Refused</h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>{error}</p>
        <button onClick={fetchStats} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
          Retry Loading
        </button>
      </div>
    );
  }

  if (!stats) return null;

  // Active statistics extraction based on selected dropdown filter
  const currentDeptObj = selectedDept ? stats.departments.find(d => d.branch === selectedDept) : null;

  const totalCount = currentDeptObj ? currentDeptObj.total : stats.totalStudents;
  const maleCount = currentDeptObj ? currentDeptObj.male : stats.male;
  const femaleCount = currentDeptObj ? currentDeptObj.female : stats.female;
  const totalCerts = selectedDept
    ? (stats.certificationsByBranch?.[selectedDept] || 0)
    : (stats.totalCertifications || 0);

  const totalPubs = selectedDept
    ? (stats.publicationsByBranch?.[selectedDept] || 0)
    : (stats.totalPublications || 0);

  const malePercent = totalCount > 0 ? ((maleCount / totalCount) * 100).toFixed(1) : '0.0';
  const femalePercent = totalCount > 0 ? ((femaleCount / totalCount) * 100).toFixed(1) : '0.0';

  // Total sections
  const sectionsCount = currentDeptObj 
    ? currentDeptObj.sectionsCount 
    : stats.departments.reduce((sum, d) => sum + d.sectionsCount, 0);

  // Department choices list
  const departmentsList = stats.departments.map(d => d.branch);

  // Bar Chart data preparation
  // If no department is selected -> Show departments total
  // If a department is selected -> Show sections breakdown within it
  const barChartData = currentDeptObj
    ? currentDeptObj.sections.map(s => ({
        label: `Sec ${s.section}`,
        value: s.total,
        color: '#10b981'
      }))
    : stats.departments.map((d, index) => {
        const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        return {
          label: d.branch,
          value: d.total,
          color: colors[index % colors.length]
        };
      });

  return (
    <div style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* Styles & Animations */}
      <style>{`
        .kpi-card {
          border-radius: 16px;
          padding: 24px;
          color: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .kpi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
        }
        .dashboard-container {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .grid-block {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          transition: border-color 0.2s ease;
        }
        .grid-block:hover {
          border-color: #cbd5e1;
        }
        .custom-select {
          padding: 10px 16px;
          border: 1.5px solid #d1d5db;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
          background-color: #fff;
          cursor: pointer;
          outline: none;
          min-width: 220px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }
        .custom-select:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
        }
        .table-row {
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.15s ease;
        }
        .table-row:hover {
          background-color: #f8fafc;
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>University Analytics Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0 0', fontWeight: 500 }}>Live academic and demographic registration monitoring system</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Filter Department:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="custom-select"
            >
              <option value="">All Departments (University)</option>
              {departmentsList.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <button onClick={handleRefresh} title="Refresh Live Data" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
              🔄
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          {/* Card 1: Total Students */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Total Students</span>
              <span style={{ fontSize: 20 }}>👥</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{totalCount.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Active in ${selectedDept}` : 'University overall enrollment'}
            </div>
          </div>

          {/* Card 2: Male Count */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Male Students</span>
              <span style={{ fontSize: 20 }}>👨</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{maleCount.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              Representing <strong style={{ textDecoration: 'underline' }}>{malePercent}%</strong> of demographic
            </div>
          </div>

          {/* Card 3: Female Count */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Female Students</span>
              <span style={{ fontSize: 20 }}>👩</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{femaleCount.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              Representing <strong style={{ textDecoration: 'underline' }}>{femalePercent}%</strong> of demographic
            </div>
          </div>

          {/* Card 4: Total Sections */}
          <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Academic Sections</span>
              <span style={{ fontSize: 20 }}>🗂️</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{sectionsCount}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Active sections in ${selectedDept}` : 'Active sections across all depts'}
            </div>
          </div>

          {/* Card 5: Certifications */}
          <div className="kpi-card" onClick={() => handleCardClick('certifications')} style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Certifications Done</span>
              <span style={{ fontSize: 20 }}>📜</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{totalCerts.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Approved in ${selectedDept}` : 'University overall certifications'}
            </div>
          </div>

          {/* Card 6: Publications */}
          <div className="kpi-card" onClick={() => handleCardClick('publications')} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>Publications Done</span>
              <span style={{ fontSize: 20 }}>📄</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{totalPubs.toLocaleString()}</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8, fontWeight: 500 }}>
              {selectedDept ? `Approved in ${selectedDept}` : 'University overall publications'}
            </div>
          </div>
        </div>

        {/* Modal Dialog */}
        {modalType && (() => {
          const isPublication = (item) => ['RESEARCH_PUBLICATION', 'PATENT', 'JOURNAL_PAPER', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER'].includes(item.activityType);
          
          const rawFiltered = modalData.filter(item => {
            const isPub = isPublication(item);
            return modalType === 'publications' ? isPub : !isPub;
          });

          const deptFiltered = rawFiltered.filter(item => {
            if (!selectedDept) return true;
            return String(item.branch || '').toUpperCase() === selectedDept.toUpperCase();
          });

          const finalFiltered = deptFiltered.filter(item => {
            if (!modalSearch) return true;
            const query = modalSearch.toLowerCase();
            return (
              (item.regNumber && item.regNumber.toLowerCase().includes(query)) ||
              (item.studentName && item.studentName.toLowerCase().includes(query)) ||
              (item.title && item.title.toLowerCase().includes(query)) ||
              (item.issuingOrg && item.issuingOrg.toLowerCase().includes(query))
            );
          });

          return (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, animation: 'fadeIn 0.2s ease-out'
            }}>
              <div style={{
                background: '#fff', borderRadius: 20, width: '90%', maxWidth: 950,
                maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                border: '1px solid #e2e8f0'
              }}>
                {/* Header */}
                <div style={{
                  padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: '#f8fafc'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                      Approved {modalType === 'publications' ? 'Publications' : 'Certifications'}
                      {selectedDept ? ` — ${selectedDept}` : ' (All Departments)'}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                      Showing {finalFiltered.length} records
                    </p>
                  </div>
                  <button
                    onClick={() => { setModalType(null); setModalSearch(''); }}
                    style={{
                      background: '#f1f5f9', border: 'none', color: '#64748b',
                      width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 'bold', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                  >
                    ✕
                  </button>
                </div>

                {/* Search Bar */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, background: '#fff' }}>
                  <input
                    type="text"
                    placeholder="Search by student name, reg no, or title..."
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    style={{
                      flex: 1, padding: '10px 16px', border: '1.5px solid #cbd5e1',
                      borderRadius: 10, fontSize: 13, outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#4f46e5'}
                    onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                </div>

                {/* Table Content */}
                <div style={{ padding: 24, overflowY: 'auto', flex: 1, minHeight: '30vh' }}>
                  {modalLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
                      <div className="spinner" style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', animation: 'spin 1s linear infinite' }} />
                      <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Loading records...</span>
                    </div>
                  ) : finalFiltered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>No Records Found</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Try changing search query</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>#</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Reg No</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Name</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Dept/Sec</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Type</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Title</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Issuing Org / Publisher</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Date</th>
                          <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 700 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalFiltered.map((item, idx) => (
                          <tr key={item._id} className="table-row">
                            <td style={{ padding: '12px 8px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>{item.regNumber}</td>
                            <td style={{ padding: '12px 8px', color: '#334155', fontWeight: 500 }}>{item.studentName}</td>
                            <td style={{ padding: '12px 8px', color: '#475569' }}>
                              <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {item.branch} - {item.section}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', color: '#475569', fontWeight: 500 }}>
                              {item.activityType}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#0f172a', fontWeight: 500 }} title={item.title}>
                              {item.title.length > 25 ? item.title.substring(0, 25) + '...' : item.title}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#475569' }}>{item.issuingOrg || '—'}</td>
                            <td style={{ padding: '12px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.date || '—'}</td>
                            <td style={{ padding: '12px 8px' }}>
                              {(item.certificateUrl || item.certificatePath) ? (
                                <ViewButton
                                  url={viewUrl(item.certificateUrl || item.certificatePath)}
                                  label="View"
                                  style={{ padding: '5px 12px', fontSize: 12, fontWeight: 700 }}
                                />
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: '16px 24px', borderTop: '1px solid #e2e8f0',
                  display: 'flex', justifyContent: 'flex-end', background: '#f8fafc'
                }}>
                  <button
                    onClick={() => { setModalType(null); setModalSearch(''); }}
                    style={{
                      background: '#64748b', color: '#fff', border: 'none',
                      padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.background = '#64748b'}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
