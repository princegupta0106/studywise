import React from 'react'
import { Link } from 'react-router-dom'
import logoSvg from '../assets/logo.svg'

export default function AboutPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--bg) 0%, #0a0f1a 50%, var(--bg) 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '15px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(17, 25, 40, 0.5)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={logoSvg} alt="Padho BC Logo" style={{ width: '28px', height: '28px' }} />
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--text-bright)',
            letterSpacing: '-0.3px'
          }}>
            Padho BC
          </h1>
        </div>
        <Link 
          to="/signin"
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-600))',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease'
          }}
        >
          Sign In
        </Link>
      </header>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', width: '100%' }}>
          <div style={{
            background: 'rgba(17, 25, 40, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '30px 25px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: '800',
              background: 'linear-gradient(135deg, var(--text-bright), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: '0 0 16px 0',
              lineHeight: '1.2'
            }}>
              Welcome to Padho BC
            </h1>
            
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--muted)',
              margin: '0 0 20px 0',
              lineHeight: '1.5',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              The ultimate study platform for <strong style={{ color: 'var(--accent)' }}>BITS Pilani students</strong>. 
              Access course materials, PYQs, and collaborate with fellow BITSians.
            </p>

            {/* Quick Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              margin: '16px 0',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center', padding: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>500+</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Materials</div>
              </div>
              <div style={{ textAlign: 'center', padding: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>1000+</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>PYQs</div>
              </div>
              <div style={{ textAlign: 'center', padding: '6px' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--accent)' }}>4</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Campuses</div>
              </div>
            </div>

            {/* Features Grid - Compact */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              margin: '20px 0',
              textAlign: 'left'
            }}>
              <div style={{
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>📚</div>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-bright)', fontSize: '14px' }}>Course Materials</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', lineHeight: '1.3' }}>
                  Organized notes for all BE/MSC programs.
                </p>
              </div>
              
              <div style={{
                padding: '12px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>📝</div>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-bright)', fontSize: '14px' }}>PYQs & Solutions</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', lineHeight: '1.3' }}>
                  Previous year questions with solutions.
                </p>
              </div>
              
              <div style={{
                padding: '12px',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '6px' }}>💬</div>
                <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-bright)', fontSize: '14px' }}>Group Chats</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '12px', lineHeight: '1.3' }}>
                  Connect with fellow BITSians.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div style={{ margin: '20px 0' }}>
              <Link 
                to="/signin"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-600))',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 8px rgba(0, 122, 204, 0.3)'
                }}
              >
                Get Started - Sign In with BITS Email
              </Link>
              
              <div style={{
                marginTop: '10px',
                padding: '6px 10px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#60a5fa'
              }}>
                <strong>🔒 Exclusive:</strong> Only BITS Pilani emails accepted
              </div>
            </div>

            {/* About & Links Section */}
            <div style={{
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                color: 'var(--text-bright)',
                textAlign: 'center'
              }}>
                About & Quick Links
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                textAlign: 'left'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--accent)' }}>📖 About</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.3' }}>
                    Created by Prince Gupta for BITS Pilani students across all campuses.
                    Centralized hub for study materials and collaboration.
                  </p>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--accent)' }}>🎓 Programs</h4>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4' }}>
                    • BE (All branches, Years 1-4)<br/>
                    • MSC (All programs, Years 2-3)<br/>
                    • All Campuses: Pilani, Hyd, Goa, Dubai
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--accent)' }}>🔗 Links</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <a href="https://www.bits-pilani.ac.in" target="_blank" rel="noopener noreferrer" style={{
                      color: '#60a5fa', fontSize: '12px', textDecoration: 'none'
                    }}>
                      🏛️ BITS Official
                    </a>
                    <a href="https://github.com/princegupta0106" target="_blank" rel="noopener noreferrer" style={{
                      color: '#60a5fa', fontSize: '12px', textDecoration: 'none'
                    }}>
                      👨‍💻 Developer
                    </a>
                    <a href="mailto:f20220106@pilani.bits-pilani.ac.in" style={{
                      color: '#60a5fa', fontSize: '12px', textDecoration: 'none'
                    }}>
                      📧 Contact
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '15px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(17, 25, 40, 0.3)'
      }}>
        <p style={{
          margin: 0,
          fontSize: '12px',
          color: 'var(--muted)'
        }}>
          Developed with ❤️ by Prince Gupta | For BITS Pilani Students
        </p>
      </footer>
    </div>
  )
}