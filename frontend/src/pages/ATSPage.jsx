// src/pages/ATSPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate }      from 'react-router'
import { useAuth }          from '../context/AuthContext'
import toast                from 'react-hot-toast'
import SourceToggle         from '../components/ats/SourceToggle'
import ScorePanel           from '../components/ats/ScorePanel'
import SuggestionsPanel     from '../components/ats/SuggestionsPanel'
import resumeService        from '../services/resumeService'

const MOCK_RESULT = {
  atsScore: 78,
  jobRole:  'Software Engineer',
  breakdown: [
    { label: 'Keyword match',        value: 82 },
    { label: 'Section completeness', value: 90 },
    { label: 'Formatting score',     value: 65 },
  ],
  keywords: {
    present: ['React', 'Node.js', 'TypeScript', 'REST API'],
    missing: ['Docker', 'Kubernetes', 'CI/CD'],
  },
  jdMatch: {
    score:   74,
    present: ['React', 'Node.js', 'REST API', 'TypeScript'],
    missing: ['Docker', 'Kubernetes', 'GraphQL'],
  },
  suggestions: [
    {
      id: 1, section: 'Experience', type: 'Improve', priority: 'High',
      before: 'Worked on various backend features',
      after:  'Engineered 4 REST API features using Node.js, reducing response time by 35%',
    },
    {
      id: 2, section: 'Skills', type: 'Add', priority: 'Medium',
      before: null,
      after:  'Add Docker, Kubernetes, CI/CD to your skills section',
    },
    {
      id: 3, section: 'Summary', type: 'Improve', priority: 'Low',
      before: 'Experienced developer looking for opportunities',
      after:  'Full-stack engineer with 3 years building scalable web apps using React and Node.js',
    },
  ],
}

const ROLES = [
  'Software Engineer',    'Frontend Developer',
  'Backend Developer',    'Data Analyst',
  'Data Scientist',       'Product Manager',
  'UX Designer',          'DevOps Engineer',
  'Full Stack Developer', 'Others',
]

// centered toast helper — reusable across all actions
function authToast(message, icon = '🔒') {
  toast(message, {
    icon,
    position: 'top-center',
    duration: 1500,
    style: {
      fontFamily:   'var(--font-body)',
      fontSize:     'var(--text-sm)',
      borderRadius: 'var(--radius-md)',
      border:       '1px solid var(--color-primary-muted)',
      color:        'var(--color-primary-dark)',
      background:   'var(--color-primary-subtle)',
      padding:      'var(--space-3) var(--space-5)',
    },
  })
}

function uploadToast() {
  toast.error('Upload your resume first', {
    icon: '📄',
    position: 'top-center',
    duration: 2000,
    style: {
      fontFamily:   'var(--font-body)',
      fontSize:     'var(--text-sm)',
      borderRadius: 'var(--radius-md)',
      border:       '1px solid var(--color-border)',
      color:        'var(--color-text-primary)',
      background:   'var(--color-bg-surface)',
      padding:      'var(--space-3) var(--space-5)',
    },
  })
}

export default function ATSPage() {
  const { token, user } = useAuth()
  const navigate  = useNavigate()

  const [source,          setSource]          = useState('upload')
  const [file,            setFile]            = useState(null)
  const [fileName,        setFileName]        = useState(null)
  const [role,            setRole]            = useState('')
  const [customRole,      setCustomRole]      = useState('')
  const [jdText,          setJdText]          = useState('')
  const [linkedInUrl,     setLinkedInUrl]     = useState('')
  const [loading,         setLoading]         = useState(false)
  const [result,          setResult]          = useState(null)
  const [linkedInProfile, setLinkedInProfile] = useState(null) // set after OAuth callback
  const [linkedinAnalyzed,setLinkedinAnalyzed]= useState(false) // true once user clicks Analyze on LinkedIn tab

  // Resume Editor State
  const [editorTab,  setEditorTab]  = useState('builder')
  const [pdfUrl,     setPdfUrl]     = useState(null)
  const [activeSection, setActiveSection] = useState('personal')
  const [builderData,setBuilderData] = useState({
    personal: {
      name: 'First Last',
      title: 'Software Engineer',
      email: 'xyz@email.com',
      phone: '1234567890',
      address: '123 XYZ Street, Bangalore, IN',
      github: 'GITHUB',
      linkedin: 'LINKEDIN',
      hackerrank: 'HACKERRANK'
    },
    education: [
      {
        id: 'edu-1',
        institution: 'XYZ UNIVERSITY',
        degree: 'B.Tech COMPUTER SCIENCE',
        gpa: '9.1',
        startDate: 'June 2015',
        endDate: 'July 2019',
        location: 'New Delhi, India'
      },
      {
        id: 'edu-2',
        institution: 'XYZ SCHOOL',
        degree: 'HIGHER SECONDARY PHYSICS, CHEMISTRY & MATHS',
        gpa: '8.8',
        startDate: 'March 2013',
        endDate: 'May 2015',
        location: 'New Delhi, India'
      }
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'HACKERRANK',
        role: 'Software Engineer 2',
        location: 'Bengaluru, India',
        startDate: 'Jan 21',
        endDate: 'Present',
        points: [
          'Write a one- or two-paragraph explanation of what the project aims to accomplish.',
          'Avoid delving deep into background or past projects.',
          'A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
        ]
      },
      {
        id: 'exp-2',
        company: 'AMAZON',
        role: 'SDE 1',
        location: 'Bangalore, IN',
        startDate: 'March 2020',
        endDate: 'December 2020',
        points: [
          'Write a one- or two-paragraph explanation of what the project aims to accomplish.',
          'Avoid delving deep into background or past projects.',
          'A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
        ]
      },
      {
        id: 'exp-3',
        company: 'MICROSOFT',
        role: 'Software Engineer',
        location: 'Delhi, IN',
        startDate: 'August 2019',
        endDate: 'February 2020',
        points: [
          'Write a one- or two-paragraph explanation of what the project aims to accomplish.',
          'Avoid delving deep into background or past projects.',
          'A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
        ]
      }
    ],
    skills: [
      {
        id: 'skill-1',
        category: 'Programming Languages',
        list: 'C/C++, Java, HTML/CSS, JavaScript, Python, SQL'
      },
      {
        id: 'skill-2',
        category: 'Libraries/Frameworks',
        list: 'Reactjs, Vuejs, Redux, Expressjs'
      },
      {
        id: 'skill-3',
        category: 'Tools / Platforms',
        list: 'Git/Github, VSCode, Github Actions, Docker'
      },
      {
        id: 'skill-4',
        category: 'Databases',
        list: 'MongoDB, PostgreSQL'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'PROJECT 1',
        link: 'LINK',
        technologies: 'JavaScript, HTML, CSS',
        description: 'Write a one- or two-paragraph explanation of what the project aims to accomplish. Avoid delving deep into background or past projects. A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
      },
      {
        id: 'proj-2',
        name: 'PROJECT 2',
        link: 'LINK',
        technologies: 'Reactjs, Expressjs, Nodejs, MongoDB',
        description: 'Write a one- or two-paragraph explanation of what the project aims to accomplish. Avoid delving deep into background or past projects. A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
      },
      {
        id: 'proj-3',
        name: 'PROJECT 3',
        link: 'LINK',
        technologies: 'Java, Distributed Systems, Computer Networks, MongoDB',
        description: 'Write a one- or two-paragraph explanation of what the project aims to accomplish. Avoid delving deep into background or past projects. A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
      }
    ],
    customSections: [
      {
        id: 'custom-1',
        title: 'CERTIFICATES',
        content: '• Certified as a Warehouse Associate under the National Skill Qualification Framework (NSQF) Level 4.\n• Awarded a certificate in the job role of Solar PV Installation Helper.\n• Successfully completed Industrial training in Printed Circuit Board (PCB) assembling at Surya Tech Solutions (STS).'
      }
    ]
  })

  // Sync user info
  useEffect(() => {
    if (user) {
      setBuilderData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          name: prev.personal.name === 'First Last' ? user.name || 'First Last' : prev.personal.name,
          email: prev.personal.email === 'xyz@email.com' ? user.email || 'xyz@email.com' : prev.personal.email
        }
      }))
    }
  }, [user])

  const updatePersonal = (field, val) => {
    setBuilderData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: val
      }
    }))
  }

  const updateEducation = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: val } : edu)
    }))
  }
  const addEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      institution: 'NEW UNIVERSITY',
      degree: 'Degree / Program',
      gpa: '9.0',
      startDate: 'Start Date',
      endDate: 'End Date',
      location: 'City, Country'
    }
    setBuilderData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }))
  }
  const deleteEducation = (id) => {
    setBuilderData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const updateExperience = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => {
        if (exp.id === id) {
          if (field === 'points') {
            return { ...exp, points: val.split('\n').filter(p => p.trim()) }
          }
          return { ...exp, [field]: val }
        }
        return exp
      })
    }))
  }
  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      company: 'NEW COMPANY',
      role: 'Job Role',
      location: 'City, Country',
      startDate: 'Start Date',
      endDate: 'End Date',
      points: ['Describe your contributions']
    }
    setBuilderData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }))
  }
  const deleteExperience = (id) => {
    setBuilderData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  const updateSkills = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      skills: prev.skills.map(sk => sk.id === id ? { ...sk, [field]: val } : sk)
    }))
  }
  const addSkills = () => {
    const newSkill = {
      id: `skill-${Date.now()}`,
      category: 'New Category',
      list: 'Skill 1, Skill 2, Skill 3'
    }
    setBuilderData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }))
  }
  const deleteSkills = (id) => {
    setBuilderData(prev => ({
      ...prev,
      skills: prev.skills.filter(sk => sk.id !== id)
    }))
  }

  const updateProjects = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      projects: prev.projects.map(proj => proj.id === id ? { ...proj, [field]: val } : proj)
    }))
  }
  const addProjects = () => {
    const newProj = {
      id: `proj-${Date.now()}`,
      name: 'NEW PROJECT',
      link: 'LINK',
      technologies: 'Tech 1, Tech 2',
      description: 'Describe your project.'
    }
    setBuilderData(prev => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }))
  }
  const deleteProjects = (id) => {
    setBuilderData(prev => ({
      ...prev,
      projects: prev.projects.filter(proj => proj.id !== id)
    }))
  }

  const updateCustomSection = (id, field, val) => {
    setBuilderData(prev => ({
      ...prev,
      customSections: prev.customSections.map(sec => sec.id === id ? { ...sec, [field]: val } : sec)
    }))
  }
  const addCustomSection = () => {
    const newSec = {
      id: `custom-${Date.now()}`,
      title: 'NEW SECTION',
      content: '• Point 1\n• Point 2'
    }
    setBuilderData(prev => ({
      ...prev,
      customSections: [...prev.customSections, newSec]
    }))
  }
  const deleteCustomSection = (id) => {
    setBuilderData(prev => ({
      ...prev,
      customSections: prev.customSections.filter(sec => sec.id !== id)
    }))
  }

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const activeRole = role === 'Others' ? customRole : role

  // Pick up LinkedIn profile data stored by LinkedInCallbackPage after OAuth
  useEffect(() => {
    const raw = sessionStorage.getItem('linkedin_resume_data')
    if (!raw) return
    sessionStorage.removeItem('linkedin_resume_data')
    try {
      const resumeData = JSON.parse(raw)
      setSource('linkedin')

      // Bug 2 fix: the backend returns a Resume DB doc.
      // The real name/email live under parsedData, not at the top level.
      // Normalize into a flat shape so LinkedInImport always has the right fields.
      const name =
        resumeData.parsedData?.name ||
        resumeData.name            ||
        resumeData.given_name      ||
        (resumeData.parsedData?.email ? resumeData.parsedData.email.split('@')[0] : null) ||
        'LinkedIn User'
      const email =
        resumeData.parsedData?.email ||
        resumeData.email             ||
        ''

      setLinkedInProfile({ name, email })   // show success card with real name
      setResultFromResume(resumeData)
    } catch (e) {
      console.warn('[ATSPage] Could not parse linkedin_resume_data', e)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear the imported profile so the user can reconnect with a different account
  function handleLinkedInReconnect() {
    setLinkedInProfile(null)
    setResult(null)
    setLinkedinAnalyzed(false)
  }

  // Analyze button handler for the LinkedIn tab
  function handleLinkedInAnalyze() {
    if (!requireAuth()) return
    if (!linkedInProfile) {
      // User hasn't connected LinkedIn yet — prompt them
      toast('Connect your LinkedIn account first to analyze your profile.', {
        icon: '🔗',
        position: 'top-center',
        duration: 3000,
        style: {
          fontFamily:   'var(--font-body)',
          fontSize:     'var(--text-sm)',
          borderRadius: 'var(--radius-md)',
          border:       '1px solid var(--color-border)',
          color:        'var(--color-text-primary)',
          background:   'var(--color-bg-surface)',
          padding:      'var(--space-3) var(--space-5)',
        },
      })
      return
    }
    // Profile already imported + analysis already ran on backend during import.
    // Just reveal the results panel.
    setLinkedinAnalyzed(true)
  }

  // redirect immediately — no delay
  function redirectToLogin() {
    navigate('/login', { replace: true })
  }

  function requireAuth() {
    if (!token) {
      authToast('Log in to use this feature')
      redirectToLogin()
      return false
    }
    return true
  }

  // ── Upload zone handlers ──────────────────────────────
  function handleDrop(e) {
    e.preventDefault()
    if (!requireAuth()) return
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDropzoneClick() {
    if (!requireAuth()) return
    document.getElementById('resume-file-input').click()
  }

  function handleFileInputChange(e) {
    const f = e.target.files[0]
    if (f) processFile(f)
  }

  function processFile(f) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    const ext = f.name.split('.').pop().toLowerCase()
    if (!allowed.includes(f.type) && !['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast.error('Only PDF, DOC/DOCX, or TXT files allowed', {
        position: 'top-center',
        style: {
          fontFamily:   'var(--font-body)',
          fontSize:     'var(--text-sm)',
          borderRadius: 'var(--radius-md)',
          background:   'var(--color-bg-surface)',
          color:        'var(--color-text-primary)',
          border:       '1px solid var(--color-border)',
        },
      })
      return
    }
    setFile(f)
    setFileName(f.name)

    if (f.type === 'application/pdf') {
      const url = URL.createObjectURL(f)
      setPdfUrl(url)
    } else {
      setPdfUrl(null)
    }
  }

  // ── LinkedIn import handlers ──────────────────────────
  function handleLinkedInUrlChange(val) {
    setLinkedInUrl(val)
  }

  async function handleLinkedInImport() {
    if (!requireAuth()) return
    if (!linkedInUrl.trim()) {
      toast.error('Please enter a LinkedIn profile URL first')
      return
    }
    setLoading(true)
    try {
      const res = await resumeService.importLinkedIn(linkedInUrl, jdText, activeRole)
      if (res.success && res.data) {
        toast.success("LinkedIn profile imported successfully!")
        setResultFromResume(res.data)
      } else {
        toast.error("Failed to import LinkedIn profile")
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Error importing LinkedIn profile")
    } finally {
      setLoading(false)
    }
  }

  // Helper to map DB resume to ATS Result state
  function setResultFromResume(resume) {
    const score = resume.atsScore || 0
    const resultData = resume.atsResult || {}
    
    const mappedSuggestions = (resume.suggestions || []).map((s, idx) => {
      if (typeof s === 'string') {
        return {
          id: idx + 1,
          section: 'Resume',
          type: 'Improve',
          priority: 'Medium',
          before: null,
          after: s
        }
      }
      return s
    })

    setResult({
      resumeId: resume._id,
      atsScore: score,
      jobRole: resultData.jobRole || activeRole || 'General',
      breakdown: resultData.breakdown || [
        { label: 'Keyword match', value: score },
        { label: 'Section completeness', value: 80 },
        { label: 'Formatting score', value: 80 },
      ],
      keywords: resultData.keywords || {
        present: resultData.jdMatch?.present || [],
        missing: resultData.jdMatch?.missing || [],
      },
      jdMatch: resultData.jdMatch || {
        score: score,
        present: resultData.jdMatch?.present || [],
        missing: resultData.jdMatch?.missing || [],
      },
      suggestions: mappedSuggestions
    })

    // Pre-populate builderData from analysis
    if (resume.parsedData) {
      const pd = resume.parsedData;
      setBuilderData({
        personal: {
          name: pd.name || user?.name || 'First Last',
          title: resultData.jobRole || activeRole || 'Software Engineer',
          email: pd.email || user?.email || 'xyz@email.com',
          phone: pd.phone || '1234567890',
          address: pd.location || '123 XYZ Street, Bangalore, IN',
          github: 'GITHUB',
          linkedin: 'LINKEDIN',
          hackerrank: 'HACKERRANK'
        },
        education: (pd.education && pd.education.length > 0) ? pd.education.map((edu, idx) => ({
          id: `edu-${idx}-${Date.now()}`,
          institution: edu.school || 'XYZ UNIVERSITY',
          degree: edu.degree || 'Degree / Program',
          gpa: '9.0',
          startDate: edu.startDate || 'Start Date',
          endDate: edu.endDate || 'End Date',
          location: 'Location'
        })) : [
          {
            id: 'edu-1',
            institution: 'XYZ UNIVERSITY',
            degree: 'B.Tech COMPUTER SCIENCE',
            gpa: '9.1',
            startDate: 'June 2015',
            endDate: 'July 2019',
            location: 'New Delhi, India'
          }
        ],
        experience: (pd.experience && pd.experience.length > 0) ? pd.experience.map((exp, idx) => ({
          id: `exp-${idx}-${Date.now()}`,
          company: exp.company || 'Company Name',
          role: exp.title || 'Role',
          location: 'Location',
          startDate: exp.startDate || 'Start Date',
          endDate: exp.endDate || 'End Date',
          points: exp.description ? exp.description.split('\n').filter(p => p.trim()) : ['Describe your contributions']
        })) : [
          {
            id: 'exp-1',
            company: 'HACKERRANK',
            role: 'Software Engineer 2',
            location: 'Bengaluru, India',
            startDate: 'Jan 21',
            endDate: 'Present',
            points: [
              'Write a one- or two-paragraph explanation of what the project aims to accomplish.',
              'Avoid delving deep into background or past projects.',
              'A good project summary will not only serve as your elevator speech, but will also help you clarify larger issues with your plan.'
            ]
          }
        ],
        skills: (pd.skills && pd.skills.length > 0) ? [
          {
            id: 'skill-1',
            category: 'Technical Skills',
            list: pd.skills.join(', ')
          }
        ] : [
          {
            id: 'skill-1',
            category: 'Programming Languages',
            list: 'C/C++, Java, HTML/CSS, JavaScript, Python, SQL'
          }
        ],
        projects: [
          {
            id: 'proj-1',
            name: 'PROJECT 1',
            link: 'LINK',
            technologies: 'JavaScript, HTML, CSS',
            description: 'Write a one- or two-paragraph explanation of what the project aims to accomplish. Avoid delving deep into background or past projects.'
          }
        ],
        customSections: []
      });
    } else {
      setBuilderData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          title: resultData.jobRole || activeRole || prev.personal.title,
        }
      }));
    }
  }

  // ── Role / JD handlers ───────────────────────────────
  function handleRoleChange(val) {
    setRole(val)
    setCustomRole('')
  }

  // ── Custom role and JD handlers ───────────────────────
  function handleCustomRoleChange(val) {
    setCustomRole(val)
  }

  function handleJdChange(val) {
    setJdText(val)
  }

  function handleSourceChange(val) {
    setSource(val)
    // Reset ALL tab state when switching so results never bleed across tabs.
    setFile(null)
    setFileName(null)
    setResult(null)
    setLoading(false)
    setLinkedinAnalyzed(false)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
  }

  // ── Download and Print helpers ──────────────────────────
  const handleDownloadText = () => {
    let text = `${builderData.personal.name.toUpperCase()}\n`;
    text += `${builderData.personal.title}\n`;
    text += `${builderData.personal.email} | ${builderData.personal.phone} | ${builderData.personal.address}\n`;
    text += `HACKERRANK: ${builderData.personal.hackerrank} | GITHUB: ${builderData.personal.github} | LINKEDIN: ${builderData.personal.linkedin}\n\n`;
    
    text += `EDUCATION\n`;
    builderData.education.forEach(edu => {
      text += `- ${edu.institution} (${edu.location})\n`;
      text += `  ${edu.degree} | GPA: ${edu.gpa}\n`;
      text += `  ${edu.startDate} - ${edu.endDate}\n`;
    });
    text += `\n`;
    
    text += `EXPERIENCE\n`;
    builderData.experience.forEach(exp => {
      text += `- ${exp.company} (${exp.location}) | ${exp.role}\n`;
      text += `  ${exp.startDate} - ${exp.endDate}\n`;
      exp.points.forEach(pt => {
        text += `  * ${pt}\n`;
      });
    });
    text += `\n`;
    
    text += `SKILLS\n`;
    builderData.skills.forEach(sk => {
      text += `- ${sk.category}: ${sk.list}\n`;
    });
    text += `\n`;
    
    text += `PROJECTS / OPEN-SOURCE\n`;
    builderData.projects.forEach(proj => {
      text += `- ${proj.name} | ${proj.link} (${proj.technologies})\n`;
      text += `  ${proj.description}\n`;
    });
    text += `\n`;

    builderData.customSections.forEach(sec => {
      text += `${sec.title.toUpperCase()}\n`;
      text += `${sec.content}\n\n`;
    });

    const element = document.createElement("a");
    const fileBlob = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(fileBlob);
    element.download = `${builderData.personal.name.replace(/\s+/g, '_')}_Resume.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Analyze ──────────────────────────────────────────
  async function handleAnalyze() {
    if (!requireAuth()) return

    if (!file && source === 'upload') {
      uploadToast()
      return
    }

    setLoading(true)
    try {
      let res
      if (source === 'upload') {
        res = await resumeService.uploadResume(file, jdText, activeRole ? [activeRole] : [])
      } else {
        if (!file) {
          uploadToast()
          setLoading(false)
          return
        }
        res = await resumeService.uploadResume(file, jdText, activeRole ? [activeRole] : [])
      }

      if (res.success && res.data) {
        toast.success("Analysis complete!")
        setResultFromResume(res.data)
      } else {
        toast.error("Failed to analyze resume.")
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Error analyzing resume. Please make sure the file is valid.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>
          Check your ATS score
        </h2>
        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
          Upload your resume, add a job description, and get instant AI analysis
        </p>
      </div>

      {/* ── Source toggle + inline input panel ── */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SourceToggle
          active={source}
          onChange={handleSourceChange}
          onFileSelect={f => {
            if (!requireAuth()) return
            processFile(f)
          }}
          importedProfile={linkedInProfile}
          onReconnect={handleLinkedInReconnect}
        />
      </div>

      {/* ── Role + JD + Analyze card — upload tab only ── */}
      {source === 'upload' && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>

          {/* Target role row */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            flexWrap:     'wrap',
            gap:          'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}>
            <label style={{
              fontSize:   'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color:      'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
            }}>
              Target role
            </label>

            <select
              value={role}
              onChange={e => handleRoleChange(e.target.value)}
              className="input"
              style={{ width: 220, height: 44, cursor: 'pointer' }}
            >
              <option value="">Select a role</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {role === 'Others' && (
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Type your job role..."
                value={customRole}
                onChange={e => handleCustomRoleChange(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Divider */}
          <div style={{
            height:       1,
            background:   'var(--color-border-surface)',
            marginBottom: 'var(--space-5)',
          }} />

          {/* Job description */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{
              display:      'block',
              fontSize:     'var(--text-sm)',
              fontWeight:   'var(--weight-medium)',
              color:        'var(--color-text-secondary)',
              marginBottom: 'var(--space-2)',
            }}>
              Job description
              <span
                className="text-tertiary"
                style={{
                  fontSize:   'var(--text-xs)',
                  fontWeight: 'var(--weight-regular)',
                  marginLeft: 'var(--space-2)',
                }}
              >
                optional — paste the JD to get a match score
              </span>
            </label>

            <textarea
              className="input textarea"
              rows={5}
              placeholder="Paste the full job description here. We'll compare it against your resume and show you exactly which keywords you're missing..."
              value={jdText}
              onChange={e => handleJdChange(e.target.value)}
            />

            {jdText.trim().length > 0 && (
              <p className="text-tertiary" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>
                {jdText.trim().split(/\s+/).length} words · JD match will run automatically
              </p>
            )}
          </div>

          {/* Analyze button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing…' : 'Analyze resume'}
            </button>
          </div>
        </div>
      )}

      {/* ── LinkedIn Analyze button — linkedin tab only ── */}
      {source === 'linkedin' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-8)' }}>
          <button
            id="linkedin-analyze-btn"
            className="btn btn-primary"
            onClick={handleLinkedInAnalyze}
            disabled={loading}
          >
            {linkedInProfile ? 'View analysis' : 'Analyze profile'}
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {/* Upload tab: show when loading or result exists */}
      {/* LinkedIn tab: show only after user explicitly clicks Analyze */}
      {((source === 'upload' && (loading || result)) ||
        (source === 'linkedin' && linkedinAnalyzed && result)) && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 'var(--space-6)',
          alignItems:          'start',
        }}>

          {/* LEFT — score + JD match */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {loading ? <LoadingSkeleton /> : (
              <>
                <ScorePanel result={result} />

                {jdText.trim().length > 0 && result.jdMatch && (
                  <div className="card">

                    <div style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      marginBottom:   'var(--space-4)',
                    }}>
                      <p style={{
                        fontSize:   'var(--text-sm)',
                        fontWeight: 'var(--weight-medium)',
                        color:      'var(--color-text-primary)',
                      }}>
                        JD match score
                      </p>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize:   'var(--text-xl)',
                        fontWeight: 'var(--weight-bold)',
                        color:      result.jdMatch.score >= 75
                          ? 'var(--color-success)'
                          : result.jdMatch.score >= 50
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)',
                      }}>
                        {result.jdMatch.score}%
                      </span>
                    </div>

                    <div className="progress-track" style={{ marginBottom: 'var(--space-4)' }}>
                      <div
                        className={`progress-fill ${
                          result.jdMatch.score >= 75 ? 'success' :
                          result.jdMatch.score >= 50 ? 'warning' : ''
                        }`}
                        style={{ width: `${result.jdMatch.score}%` }}
                      />
                    </div>

                    <p style={{
                      fontSize:     'var(--text-xs)',
                      fontWeight:   'var(--weight-medium)',
                      color:        'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      Keywords present
                    </p>
                    <div style={{
                      display:      'flex',
                      flexWrap:     'wrap',
                      gap:          'var(--space-2)',
                      marginBottom: 'var(--space-4)',
                    }}>
                      {result.jdMatch.present.map(k => (
                        <span key={k} className="badge keyword-pill-present">{k}</span>
                      ))}
                    </div>

                    <p style={{
                      fontSize:     'var(--text-xs)',
                      fontWeight:   'var(--weight-medium)',
                      color:        'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      Missing keywords
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {result.jdMatch.missing.map(k => (
                        <span key={k} className="badge keyword-pill-missing">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT — suggestions */}
          <div>
            {loading
              ? <LoadingSkeleton />
              : <SuggestionsPanel 
                  suggestions={result.suggestions} 
                  resumeId={result.resumeId} 
                  fileName={fileName} 
                />
            }
          </div>
        </div>
      )}

      {/* ── Resume Editor Section ── */}
      {result && (
        <div style={{ marginTop: 'var(--space-10)' }}>
          {/* Styles block for clean resume printing */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #resume-print-area, #resume-print-area * {
                visibility: visible !important;
              }
              #resume-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-4)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)'
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
                Resume Editor
              </h3>
              <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                Refine your resume using the AI suggestions above
              </p>
            </div>
            {/* Tabs */}
            <div className="toggle-group" style={{ margin: 0 }}>
              <button
                className={`toggle-btn ${editorTab === 'pdf' ? 'active' : ''}`}
                onClick={() => setEditorTab('pdf')}
              >
                Original PDF
              </button>
              <button
                className={`toggle-btn ${editorTab === 'builder' ? 'active' : ''}`}
                onClick={() => setEditorTab('builder')}
              >
                Visual Builder
              </button>
            </div>
          </div>

          {/* Editor Card */}
          <div className="card" style={{ padding: 'var(--space-6)', minHeight: '600px' }}>
            {editorTab === 'pdf' ? (
              <div style={{ height: '650px', width: '100%' }}>
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                    }}
                    title="Original PDF"
                  />
                ) : (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg-surface-2)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--color-border)',
                    padding: 'var(--space-8)'
                  }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" style={{ marginBottom: 'var(--space-3)', opacity: 0.7 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>
                      No PDF file available
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px', textAlign: 'center' }}>
                      PDF preview is only available when a PDF file is uploaded. Try uploading a PDF.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Visual Builder content */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                
                {/* Left Column: Form Editor with tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 'var(--space-4)' }}>
                  {/* Tabs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {[
                      { id: 'personal',   label: '👤 Personal Info' },
                      { id: 'education',  label: '🎓 Education' },
                      { id: 'experience', label: '💼 Experience' },
                      { id: 'skills',     label: '⚡ Skills' },
                      { id: 'projects',   label: '🚀 Projects' },
                      { id: 'custom',     label: '➕ Custom/Certificates' },
                    ].map(sec => (
                      <button
                        key={sec.id}
                        className={`btn ${activeSection === sec.id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textAlign: 'left', justifyContent: 'flex-start', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-xs)', width: '100%' }}
                        onClick={() => setActiveSection(sec.id)}
                      >
                        {sec.label}
                      </button>
                    ))}
                    
                    <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: 'var(--text-xs)', width: '100%' }}
                        onClick={handleDownloadText}
                      >
                        Download Text
                      </button>
                      
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 'var(--text-xs)', width: '100%' }}
                        onClick={handlePrint}
                      >
                        Print/Save PDF
                      </button>
                    </div>
                  </div>

                  {/* Form fields depending on active tab */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxHeight: '620px', overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                    {activeSection === 'personal' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Personal Info</h4>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Full Name</label>
                          <input className="input" value={builderData.personal.name} onChange={e => updatePersonal('name', e.target.value)} placeholder="Full Name" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Job Title</label>
                          <input className="input" value={builderData.personal.title} onChange={e => updatePersonal('title', e.target.value)} placeholder="Job Title" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email</label>
                            <input className="input" value={builderData.personal.email} onChange={e => updatePersonal('email', e.target.value)} placeholder="email@example.com" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Phone</label>
                            <input className="input" value={builderData.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} placeholder="Phone number" />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Address</label>
                          <input className="input" value={builderData.personal.address} onChange={e => updatePersonal('address', e.target.value)} placeholder="City, State, Country" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>GitHub</label>
                            <input className="input" value={builderData.personal.github} onChange={e => updatePersonal('github', e.target.value)} placeholder="GITHUB" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>LinkedIn</label>
                            <input className="input" value={builderData.personal.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} placeholder="LINKEDIN" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>HackerRank</label>
                            <input className="input" value={builderData.personal.hackerrank} onChange={e => updatePersonal('hackerrank', e.target.value)} placeholder="HACKERRANK" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSection === 'education' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Education</h4>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={addEducation}>+ Add Education</button>
                        </div>
                        
                        {builderData.education.map((edu, idx) => (
                          <div key={edu.id} className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Entry #{idx + 1}</span>
                              <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--color-danger)' }} onClick={() => deleteEducation(edu.id)}>Delete</button>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>School/University</label>
                              <input className="input" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} placeholder="e.g. XYZ UNIVERSITY" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Degree / Field of Study</label>
                              <input className="input" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>GPA/Marks</label>
                                <input className="input" value={edu.gpa} onChange={e => updateEducation(edu.id, 'gpa', e.target.value)} placeholder="e.g. 9.1" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Start Date</label>
                                <input className="input" value={edu.startDate} onChange={e => updateEducation(edu.id, 'startDate', e.target.value)} placeholder="e.g. June 2015" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>End Date</label>
                                <input className="input" value={edu.endDate} onChange={e => updateEducation(edu.id, 'endDate', e.target.value)} placeholder="e.g. July 2019" />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Location</label>
                              <input className="input" value={edu.location} onChange={e => updateEducation(edu.id, 'location', e.target.value)} placeholder="e.g. New Delhi, India" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 'experience' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Work Experience</h4>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={addExperience}>+ Add Experience</button>
                        </div>

                        {builderData.experience.map((exp, idx) => (
                          <div key={exp.id} className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Entry #{idx + 1}</span>
                              <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--color-danger)' }} onClick={() => deleteExperience(exp.id)}>Delete</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Company</label>
                                <input className="input" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="e.g. HACKERRANK" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Role</label>
                                <input className="input" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="e.g. Software Engineer" />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Location</label>
                                <input className="input" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} placeholder="e.g. Bengaluru, India" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Start Date</label>
                                <input className="input" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} placeholder="e.g. Jan 21" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>End Date</label>
                                <input className="input" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} placeholder="e.g. Present" />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Bullet Points (One per line)</label>
                              <textarea className="input textarea" rows={4} value={exp.points.join('\n')} onChange={e => updateExperience(exp.id, 'points', e.target.value)} placeholder="Write each accomplishment on a new line" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 'skills' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Skills Categories</h4>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={addSkills}>+ Add Category</button>
                        </div>

                        {builderData.skills.map((sk, idx) => (
                          <div key={sk.id} className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Category #{idx + 1}</span>
                              <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--color-danger)' }} onClick={() => deleteSkills(sk.id)}>Delete</button>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Category Title</label>
                              <input className="input" value={sk.category} onChange={e => updateSkills(sk.id, 'category', e.target.value)} placeholder="e.g. Programming Languages" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Items (Comma-separated)</label>
                              <input className="input" value={sk.list} onChange={e => updateSkills(sk.id, 'list', e.target.value)} placeholder="e.g. C/C++, Java, Python" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 'projects' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Projects / Open-Source</h4>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={addProjects}>+ Add Project</button>
                        </div>

                        {builderData.projects.map((proj, idx) => (
                          <div key={proj.id} className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Project #{idx + 1}</span>
                              <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--color-danger)' }} onClick={() => deleteProjects(proj.id)}>Delete</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Project Name</label>
                                <input className="input" value={proj.name} onChange={e => updateProjects(proj.id, 'name', e.target.value)} placeholder="e.g. PROJECT 1" />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Link URL/Label</label>
                                <input className="input" value={proj.link} onChange={e => updateProjects(proj.id, 'link', e.target.value)} placeholder="e.g. LINK" />
                              </div>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Technologies Used</label>
                              <input className="input" value={proj.technologies} onChange={e => updateProjects(proj.id, 'technologies', e.target.value)} placeholder="e.g. Reactjs, Nodejs" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Description</label>
                              <textarea className="input textarea" rows={3} value={proj.description} onChange={e => updateProjects(proj.id, 'description', e.target.value)} placeholder="Describe the project achievements" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeSection === 'custom' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>Custom Sections</h4>
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={addCustomSection}>+ Add Custom Section</button>
                        </div>

                        {builderData.customSections.map((sec, idx) => (
                          <div key={sec.id} className="card" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-surface-2)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Custom Section #{idx + 1}</span>
                              <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--color-danger)' }} onClick={() => deleteCustomSection(sec.id)}>Delete</button>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Section Title</label>
                              <input className="input" value={sec.title} onChange={e => updateCustomSection(sec.id, 'title', e.target.value)} placeholder="e.g. CERTIFICATES" />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Content (use • for bullets)</label>
                              <textarea className="input textarea" rows={4} value={sec.content} onChange={e => updateCustomSection(sec.id, 'content', e.target.value)} placeholder="Enter details or bullet points..." />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Premium Georgia Serif A4 Preview */}
                <div style={{
                  background: 'var(--color-bg-surface-2)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflowY: 'auto',
                  maxHeight: '620px'
                }}>
                  <div id="resume-print-area" style={{
                    background: '#ffffff',
                    color: '#000000',
                    padding: '30px 40px',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    minHeight: '800px',
                    fontFamily: 'Georgia, serif',
                    textAlign: 'left'
                  }}>
                    {/* Header Name */}
                    <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                      <h1 style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '28px',
                        fontWeight: 'normal',
                        color: '#000000',
                        margin: '0 0 4px 0',
                        letterSpacing: '0.5px'
                      }}>
                        {builderData.personal.name}
                      </h1>
                      
                      {/* Sub-header details */}
                      <div style={{
                        fontSize: '11px',
                        color: '#555555',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        marginBottom: '4px'
                      }}>
                        {builderData.personal.email && <span>{builderData.personal.email}</span>}
                        {builderData.personal.email && builderData.personal.phone && <span>|</span>}
                        {builderData.personal.phone && <span>{builderData.personal.phone}</span>}
                        {builderData.personal.phone && builderData.personal.address && <span>|</span>}
                        {builderData.personal.address && <span>{builderData.personal.address}</span>}
                      </div>

                      {/* Header links */}
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#000000',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}>
                        {builderData.personal.hackerrank && <span>{builderData.personal.hackerrank}</span>}
                        {builderData.personal.hackerrank && builderData.personal.github && <span>|</span>}
                        {builderData.personal.github && <span>{builderData.personal.github}</span>}
                        {builderData.personal.github && builderData.personal.linkedin && <span>|</span>}
                        {builderData.personal.linkedin && <span>{builderData.personal.linkedin}</span>}
                      </div>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: '#000000', marginBottom: '18px' }} />

                    {/* EDUCATION SECTION */}
                    {builderData.education && builderData.education.length > 0 && (
                      <div style={{ marginBottom: '18px' }}>
                        <h3 style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#333333',
                          letterSpacing: '1px',
                          borderBottom: '1px solid #777777',
                          paddingBottom: '2px',
                          margin: '0 0 10px 0',
                          textTransform: 'uppercase'
                        }}>
                          Education
                        </h3>
                        {builderData.education.map(edu => (
                          <div key={edu.id} style={{ marginBottom: '10px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                              <span>{edu.institution.toUpperCase()}</span>
                              <span style={{ fontWeight: 'normal' }}>{edu.startDate} – {edu.endDate}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{edu.degree}</span>
                              <span style={{ color: '#555555' }}>{edu.location}</span>
                            </div>
                            {edu.gpa && (
                              <div style={{ color: '#333333', marginTop: '1px' }}>
                                GPA: {edu.gpa}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EXPERIENCE SECTION */}
                    {builderData.experience && builderData.experience.length > 0 && (
                      <div style={{ marginBottom: '18px' }}>
                        <h3 style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#333333',
                          letterSpacing: '1px',
                          borderBottom: '1px solid #777777',
                          paddingBottom: '2px',
                          margin: '0 0 10px 0',
                          textTransform: 'uppercase'
                        }}>
                          Experience
                        </h3>
                        {builderData.experience.map(exp => (
                          <div key={exp.id} style={{ marginBottom: '12px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 'bold' }}>
                                {exp.company.toUpperCase()} | <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>{exp.role}</span>
                              </span>
                              <span>{exp.location} | {exp.startDate} – {exp.endDate}</span>
                            </div>
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', listStyleType: 'disc', color: '#222222', lineHeight: '1.4' }}>
                              {exp.points.map((pt, idx) => (
                                <li key={idx} style={{ marginBottom: '2px' }}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* SKILLS SECTION */}
                    {builderData.skills && builderData.skills.length > 0 && (
                      <div style={{ marginBottom: '18px' }}>
                        <h3 style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#333333',
                          letterSpacing: '1px',
                          borderBottom: '1px solid #777777',
                          paddingBottom: '2px',
                          margin: '0 0 10px 0',
                          textTransform: 'uppercase'
                        }}>
                          Skills
                        </h3>
                        {builderData.skills.map(sk => (
                          <div key={sk.id} style={{ display: 'flex', fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', width: '180px', textTransform: 'uppercase', flexShrink: 0 }}>
                              {sk.category}
                            </span>
                            <span>{sk.list}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PROJECTS SECTION */}
                    {builderData.projects && builderData.projects.length > 0 && (
                      <div style={{ marginBottom: '18px' }}>
                        <h3 style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#333333',
                          letterSpacing: '1px',
                          borderBottom: '1px solid #777777',
                          paddingBottom: '2px',
                          margin: '0 0 10px 0',
                          textTransform: 'uppercase'
                        }}>
                          Projects / Open-Source
                        </h3>
                        {builderData.projects.map(proj => (
                          <div key={proj.id} style={{ marginBottom: '10px', fontSize: '11px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                              <span>{proj.name.toUpperCase()} | <span style={{ fontWeight: 'normal', textDecoration: 'underline' }}>{proj.link}</span></span>
                              <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>{proj.technologies}</span>
                            </div>
                            <p style={{ margin: '2px 0 0 0', color: '#222222', lineHeight: '1.4' }}>
                              {proj.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CUSTOM SECTIONS */}
                    {builderData.customSections && builderData.customSections.map(sec => (
                      <div key={sec.id} style={{ marginBottom: '18px' }}>
                        <h3 style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#333333',
                          letterSpacing: '1px',
                          borderBottom: '1px solid #777777',
                          paddingBottom: '2px',
                          margin: '0 0 10px 0',
                          textTransform: 'uppercase'
                        }}>
                          {sec.title}
                        </h3>
                        <p style={{ margin: '0', fontSize: '11px', color: '#222222', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {[200, 140, 100].map(h => (
        <div key={h} style={{
          height:         h,
          borderRadius:   'var(--radius-lg)',
          background:     'linear-gradient(90deg, var(--color-accent-light) 25%, var(--color-primary-subtle) 50%, var(--color-accent-light) 75%)',
          backgroundSize: '200% 100%',
          animation:      'shimmer 1.4s infinite',
        }} />
      ))}
    </div>
  )
}