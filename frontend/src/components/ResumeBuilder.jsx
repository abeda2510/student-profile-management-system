import React, { useState } from 'react';

const inp = { padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, width: '100%', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' };
const label = { fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: 4 };
const btn = (bg) => ({ background: bg, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' });

export default function ResumeBuilder({ student, onClose }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0: Skills
  const [skillGroups, setSkillGroups] = useState([
    { category: 'Programming Languages', items: '' },
    { category: 'Web Technologies', items: '' },
    { category: 'Database Management', items: '' },
    { category: 'Tools & Platforms', items: '' },
  ]);

  // Step 1: Projects
  const [projects, setProjects] = useState([{ name: '', duration: '', tech: '', points: ['', '', ''] }]);

  // Step 2: Internship
  const [hasInternship, setHasInternship] = useState(false);
  const [internship, setInternship] = useState({ role: '', company: '', location: '', duration: '', points: ['', '', ''] });

  // Step 3: Certifications
  const [certifications, setCertifications] = useState(['']);

  // Step 4: Extra achievements / activities
  const [extraAch, setExtraAch] = useState(['']);

  const steps = ['Technical Skills', 'Projects', 'Internship', 'Certifications', 'Preview & Generate'];

  const updateSkill = (i, val) => setSkillGroups(g => g.map((s, idx) => idx === i ? { ...s, items: val } : s));
  const updateProj = (i, key, val) => setProjects(p => p.map((pr, idx) => idx === i ? { ...pr, [key]: val } : pr));
  const updateProjPoint = (pi, pti, val) => setProjects(p => p.map((pr, idx) => idx === pi ? { ...pr, points: pr.points.map((pt, j) => j === pti ? val : pt) } : pr));
  const addProject = () => setProjects(p => [...p, { name: '', duration: '', tech: '', points: ['', '', ''] }]);
  const removeProject = (i) => setProjects(p => p.filter((_, idx) => idx !== i));

  const generate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || '/api';
      const payload = { skillGroups, projects, internship: hasInternship ? internship : null, certifications: certifications.filter(Boolean), extraAchievements: extraAch.filter(Boolean) };
      const res = await fetch(`${baseUrl}/ai/generate-resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) { alert('Error: ' + data.message); setLoading(false); return; }
      renderResume(data);
    } catch { alert('AI service unavailable'); }
    setLoading(false);
  };

  const renderResume = (data) => {
    const s = student;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Times New Roman',Times,serif; font-size:10.5pt; color:#000; background:#fff; }
.page { width:210mm; min-height:297mm; padding:14mm 16mm; }
.name { text-align:center; font-size:17pt; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
.contact-line { text-align:center; font-size:9.5pt; color:#222; margin-top:3px; }
.section-title { font-size:10.5pt; font-weight:700; border-bottom:1.5px solid #000; padding-bottom:1px; margin:9px 0 4px; }
.body-text { font-size:10pt; line-height:1.45; }
.skill-row { margin-bottom:2px; font-size:10pt; }
.row { display:flex; justify-content:space-between; align-items:baseline; }
.bold { font-weight:700; }
.italic { font-style:italic; }
ul { padding-left:18px; margin:2px 0; }
ul li { font-size:10pt; margin-bottom:1px; line-height:1.4; }
@media print { body { -webkit-print-color-adjust:exact; } }
</style>
</head><body><div class="page">
<div class="name">${s.name || ''}</div>
<div class="contact-line">${[s.phone, s.email, s.linkedIn, s.leetCode ? 'LeetCode: '+s.leetCode : '', s.codeChef ? 'CodeChef: '+s.codeChef : ''].filter(Boolean).join(' | ')}</div>

<div class="section-title">Professional Summary</div>
<div class="body-text">${data.summary || ''}</div>

<div class="section-title">Technical Skills</div>
${(data.skillGroups || []).map(g => `<div class="skill-row"><b>${g.category}:</b> ${g.items}</div>`).join('')}

<div class="section-title">Education</div>
${(data.education || []).map(e => `
<div class="row"><div><span class="bold">${e.degree}</span><br/><span>${e.institution}</span></div><div style="text-align:right"><span class="bold">${e.year||''}</span><br/><span>${e.cgpa ? 'CGPA: '+e.cgpa+'/10.0' : (e.percentage||'')}</span></div></div>`).join('<div style="margin:3px"></div>')}

${(data.projects && data.projects.length > 0) ? `
<div class="section-title">Projects</div>
${data.projects.map(p => `
<div class="row"><span class="bold">${p.name}</span><span class="bold">${p.duration||''}</span></div>
<ul>${p.points.filter(Boolean).map(pt => `<li>${pt}</li>`).join('')}</ul>`).join('')}` : ''}

${data.internship ? `
<div class="section-title">Internship Experience</div>
<div class="row"><span class="bold">${data.internship.role}</span><span class="bold">${data.internship.duration||''}</span></div>
<div class="italic">${data.internship.company}${data.internship.location ? ', '+data.internship.location : ''}</div>
<ul>${(data.internship.points||[]).filter(Boolean).map(pt=>`<li>${pt}</li>`).join('')}</ul>` : ''}

${(data.certifications && data.certifications.length > 0) ? `
<div class="section-title">Certifications</div>
<ul>${data.certifications.map(c=>`<li>${c}</li>`).join('')}</ul>` : ''}

${(data.achievements && data.achievements.length > 0) ? `
<div class="section-title">Academic Achievements & Activities</div>
<ul>${data.achievements.map(a=>`<li>${a}</li>`).join('')}</ul>` : ''}

</div></body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 800);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#1e40af)', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>🤖 AI Resume Builder</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>Step {step + 1} of {steps.length}: {steps[step]}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', padding: '0 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', fontSize: 10, fontWeight: i === step ? 700 : 400, color: i === step ? '#7c3aed' : i < step ? '#059669' : '#94a3b8', borderBottom: i === step ? '2px solid #7c3aed' : '2px solid transparent', cursor: i < step ? 'pointer' : 'default' }} onClick={() => i < step && setStep(i)}>
              {i < step ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Step 0: Skills */}
          {step === 0 && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Enter your technical skills grouped by category. Only include what you're comfortable explaining in interviews.</p>
              {skillGroups.map((sg, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <label style={label}>{sg.category}</label>
                  <input style={inp} value={sg.items} placeholder={`e.g. ${i===0?'Java, Python, C++':i===1?'HTML5, CSS3, React.js':i===2?'MySQL, MongoDB':'Git, VS Code, AWS'}`} onChange={e => updateSkill(i, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Projects */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Add your academic/personal projects. Use action verbs and focus on your contribution.</p>
              {projects.map((p, i) => (
                <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Project {i + 1}</span>
                    {projects.length > 1 && <button onClick={() => removeProject(i)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Remove</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div><label style={label}>Project Name</label><input style={inp} value={p.name} placeholder="e.g. Student Management System" onChange={e => updateProj(i, 'name', e.target.value)} /></div>
                    <div><label style={label}>Duration (MM/YYYY - MM/YYYY)</label><input style={inp} value={p.duration} placeholder="01/2024 - 04/2024" onChange={e => updateProj(i, 'duration', e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: 10 }}><label style={label}>Technologies Used</label><input style={inp} value={p.tech} placeholder="React, Node.js, MongoDB" onChange={e => updateProj(i, 'tech', e.target.value)} /></div>
                  {p.points.map((pt, j) => (
                    <div key={j} style={{ marginBottom: 6 }}>
                      <label style={label}>Point {j + 1}</label>
                      <input style={inp} value={pt} placeholder={j===0?'Developed [feature] using [tech] to achieve [goal]':j===1?'Implemented [functionality] resulting in [outcome]':'Collaborated with team to deliver [result]'} onChange={e => updateProjPoint(i, j, e.target.value)} />
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={addProject} style={{ ...btn('#059669'), fontSize: 13 }}>+ Add Another Project</button>
            </div>
          )}

          {/* Step 2: Internship */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <input type="checkbox" id="hasIntern" checked={hasInternship} onChange={e => setHasInternship(e.target.checked)} style={{ width: 16, height: 16 }} />
                <label htmlFor="hasIntern" style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>I have internship experience</label>
              </div>
              {hasInternship && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div><label style={label}>Role / Position</label><input style={inp} value={internship.role} placeholder="Software Development Intern" onChange={e => setInternship(i => ({...i, role: e.target.value}))} /></div>
                    <div><label style={label}>Company Name</label><input style={inp} value={internship.company} placeholder="Company Name" onChange={e => setInternship(i => ({...i, company: e.target.value}))} /></div>
                    <div><label style={label}>Location</label><input style={inp} value={internship.location} placeholder="City, State" onChange={e => setInternship(i => ({...i, location: e.target.value}))} /></div>
                    <div><label style={label}>Duration</label><input style={inp} value={internship.duration} placeholder="MM/YYYY - MM/YYYY" onChange={e => setInternship(i => ({...i, duration: e.target.value}))} /></div>
                  </div>
                  {internship.points.map((pt, j) => (
                    <div key={j} style={{ marginBottom: 8 }}>
                      <label style={label}>Point {j + 1}</label>
                      <input style={inp} value={pt} placeholder={j===0?'Contributed to [project] using [technologies]':j===1?'Implemented [task] that improved [metric] by [number]':'Collaborated with team to deliver [outcome]'} onChange={e => setInternship(i => ({...i, points: i.points.map((p,k)=>k===j?e.target.value:p)}))} />
                    </div>
                  ))}
                </div>
              )}
              {!hasInternship && <p style={{ color: '#94a3b8', fontSize: 13 }}>No internship section will be added to your resume.</p>}
            </div>
          )}

          {/* Step 3: Certifications */}
          {step === 3 && (
            <div>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Add certifications from platforms like Coursera, NPTEL, AWS, Google, etc.</p>
              {certifications.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input style={{ ...inp, flex: 1 }} value={c} placeholder="e.g. Python for Everybody from Coursera (MM/YYYY)" onChange={e => setCertifications(cs => cs.map((x, j) => j === i ? e.target.value : x))} />
                  {certifications.length > 1 && <button onClick={() => setCertifications(cs => cs.filter((_, j) => j !== i))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0 12px', borderRadius: 8, cursor: 'pointer' }}>✕</button>}
                </div>
              ))}
              <button onClick={() => setCertifications(cs => [...cs, ''])} style={{ ...btn('#059669'), fontSize: 13 }}>+ Add Certification</button>

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Academic Achievements & Activities (competitions, clubs, workshops)</p>
                {extraAch.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input style={{ ...inp, flex: 1 }} value={a} placeholder="e.g. 2nd place in Hackathon at XYZ College" onChange={e => setExtraAch(as => as.map((x, j) => j === i ? e.target.value : x))} />
                    {extraAch.length > 1 && <button onClick={() => setExtraAch(as => as.filter((_, j) => j !== i))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '0 12px', borderRadius: 8, cursor: 'pointer' }}>✕</button>}
                  </div>
                ))}
                <button onClick={() => setExtraAch(as => [...as, ''])} style={{ ...btn('#059669'), fontSize: 13 }}>+ Add Achievement</button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 16 }}>Review your inputs before generating. The AI will write your Professional Summary and polish the content.</p>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
                <div><b>Name:</b> {student.name}</div>
                <div><b>Contact:</b> {student.phone} | {student.email}</div>
                <div><b>Skills:</b> {skillGroups.filter(s=>s.items).map(s=>`${s.category}: ${s.items}`).join(' | ')}</div>
                <div><b>Projects:</b> {projects.filter(p=>p.name).map(p=>p.name).join(', ') || 'None'}</div>
                <div><b>Internship:</b> {hasInternship ? `${internship.role} at ${internship.company}` : 'None'}</div>
                <div><b>Certifications:</b> {certifications.filter(Boolean).join(', ') || 'None'}</div>
                <div><b>Achievements:</b> {extraAch.filter(Boolean).join(', ') || 'None'}</div>
              </div>
              <p style={{ fontSize: 12, color: '#7c3aed', marginTop: 12 }}>✨ AI will generate your Professional Summary and format everything into an ATS-optimized one-page resume.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ ...btn('#64748b') }}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < steps.length - 1
            ? <button onClick={() => setStep(s => s + 1)} style={{ ...btn('linear-gradient(135deg,#7c3aed,#1e40af)') }}>Next →</button>
            : <button onClick={generate} disabled={loading} style={{ ...btn('linear-gradient(135deg,#7c3aed,#1e40af)'), opacity: loading ? 0.7 : 1 }}>
                {loading ? '⏳ Generating...' : '🚀 Generate Resume'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}
