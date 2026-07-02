import React, { useState } from 'react';
import { Network, Database, ShieldAlert, ShieldCheck, Key, Server, Cpu, HardDrive } from 'lucide-react';

export default function AWSVisualizer({ metrics, onToggleRule }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!metrics) return <div style={{ color: 'var(--text-secondary)' }}>Loading AWS Cloud status...</div>;

  const { ec2, rds, s3, vpc } = metrics;
  const rules = ec2.securityGroupRules;

  // Determine path/flow colors based on rules
  const clientToWebColor = (rules.http.allowed || rules.https.allowed) ? '#10b981' : '#ef4444';
  const sshToWebColor = rules.ssh.allowed ? '#f59e0b' : 'rgba(255,255,255,0.1)';
  const webToRdsColor = '#3b82f6'; // Database query connection
  const rdsInternetColor = rules.database.allowed ? '#ef4444' : 'rgba(255,255,255,0.1)';

  // Details for Tooltips
  const tooltips = {
    igw: {
      title: "AWS Internet Gateway (igw-05f32)",
      details: "Allows communication between resources in your VPC and the internet. Connected to Public Route Tables."
    },
    ec2: {
      title: `EC2 Instance: ${ec2.instanceId} (${ec2.instanceType})`,
      details: `State: ${ec2.state.toUpperCase()} | Public IP: ${ec2.publicIp} | Private IP: ${ec2.privateIp}\nUptime: ${ec2.uptime} | CPU load: ${ec2.cpuPercent}%\nRuns portal node app behind Express API.`
    },
    rds: {
      title: `Amazon RDS instance: ${rds.dbInstanceId}`,
      details: `Engine: ${rds.engine} | Status: ${rds.status}\nEndpoint: ${rds.endpoint}\nSimulated storage allocated: ${rds.storageAllocatedGb} GB.`
    },
    s3: {
      title: `S3 Bucket: ${s3.bucketName}`,
      details: `ARN: ${s3.arn}\nRegion: ${s3.region} | Files: ${s3.objectCount}\nEncryption: ${s3.encryption}\nNotes and submissions bucket.`
    },
    vpce: {
      title: "VPC S3 Gateway Endpoint (vpce-0c1f)",
      details: "Enables private connectivity from VPC to S3 without going through public internet or NAT gateways."
    }
  };

  return (
    <div className="aws-console">
      {/* Topology Canvas */}
      <div className="aws-canvas-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e2e4a', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
            <Network size={20} />
            <h3 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }}>AWS VPC Interactive Topology Map</h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            *Hover over nodes for specs
          </span>
        </div>

        <svg viewBox="0 0 800 480" className="aws-svg" style={{ backgroundColor: '#020916', borderRadius: '8px' }}>
          {/* Defs for gradients & markers */}
          <defs>
            <linearGradient id="vpcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#081830" />
              <stop offset="100%" stopColor="#030c1b" />
            </linearGradient>
            <linearGradient id="subnetPubGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b2447" />
              <stop offset="100%" stopColor="#07162c" />
            </linearGradient>
            <linearGradient id="subnetPrivGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b2520" />
              <stop offset="100%" stopColor="#041210" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#60a5fa" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* VPC Boundary */}
          <rect x="100" y="50" width="580" height="380" rx="15" fill="url(#vpcGrad)" stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="6 3" />
          <text x="120" y="75" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="monospace">
            VPC: {vpc.vpcId} ({vpc.cidrBlock})
          </text>

          {/* Internet Gateway */}
          <g 
            transform="translate(30, 220)" 
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveTooltip('igw')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <rect x="0" y="0" width="45" height="45" rx="6" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
            <circle cx="22.5" cy="22.5" r="14" fill="none" stroke="#60a5fa" strokeWidth="2" />
            <path d="M 12 22.5 L 33 22.5" stroke="#60a5fa" strokeWidth="2" />
            <path d="M 22.5 12 L 22.5 33" stroke="#60a5fa" strokeWidth="2" />
            <text x="-15" y="-8" fill="#94a3b8" fontSize="10" fontWeight="bold">Internet Gateway</text>
          </g>

          {/* Public Subnets (Top half of VPC) */}
          <rect x="120" y="95" width="250" height="155" rx="10" fill="url(#subnetPubGrad)" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="135" y="115" fill="#93c5fd" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Public Subnet 1A ({vpc.subnets.publicA.cidr})
          </text>

          {/* Private Subnet 1A (Bottom half of VPC) */}
          <rect x="120" y="260" width="250" height="155" rx="10" fill="url(#subnetPrivGrad)" stroke="#10b981" strokeWidth="1.5" />
          <text x="135" y="280" fill="#a7f3d0" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Private Subnet 1A ({vpc.subnets.privateA.cidr})
          </text>

          {/* Public Subnet 1B (Right half top) */}
          <rect x="390" y="95" width="270" height="155" rx="10" fill="url(#subnetPubGrad)" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="405" y="115" fill="#93c5fd" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Public Subnet 1B ({vpc.subnets.publicB.cidr})
          </text>

          {/* Private Subnet 1B (Right half bottom) */}
          <rect x="390" y="260" width="270" height="155" rx="10" fill="url(#subnetPrivGrad)" stroke="#10b981" strokeWidth="1.5" />
          <text x="405" y="280" fill="#a7f3d0" fontSize="11" fontWeight="bold" fontFamily="monospace">
            Private Subnet 1B ({vpc.subnets.privateB.cidr})
          </text>

          {/* External S3 Bucket */}
          <g 
            transform="translate(710, 210)" 
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveTooltip('s3')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            {/* Cylinder representation */}
            <path d="M 5,10 A 20,8 0 0,0 45,10 A 20,8 0 0,0 5,10" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
            <path d="M 5,10 V 45 A 20,8 0 0,0 45,45 V 10" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
            <path d="M 5,20 A 20,8 0 0,0 45,20" fill="none" stroke="#ea580c" strokeWidth="1.5" />
            <path d="M 5,30 A 20,8 0 0,0 45,30" fill="none" stroke="#ea580c" strokeWidth="1.5" />
            <text x="25" y="28" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">S3</text>
            <text x="25" y="60" fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">S3 Bucket</text>
          </g>

          {/* VPC S3 Endpoint */}
          <g 
            transform="translate(615, 230)"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveTooltip('vpce')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <circle cx="15" cy="15" r="13" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
            <text x="15" y="19" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">VPCE</text>
          </g>

          {/* EC2 Node inside Public Subnet 1A */}
          <g 
            transform="translate(195, 140)" 
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveTooltip('ec2')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <rect x="0" y="0" width="100" height="70" rx="8" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
            {/* Server Grid lines */}
            <line x1="15" y1="20" x2="85" y2="20" stroke="#f97316" strokeWidth="1.5" />
            <line x1="15" y1="35" x2="85" y2="35" stroke="#f97316" strokeWidth="1.5" />
            <line x1="15" y1="50" x2="85" y2="50" stroke="#f97316" strokeWidth="1.5" />
            {/* Server LEDs */}
            <circle cx="80" cy="20" r="3" fill="#10b981" />
            <circle cx="80" cy="35" r="3" fill="#10b981" />
            <circle cx="80" cy="50" r="3" fill={ec2.cpuPercent > 60 ? '#f59e0b' : '#10b981'} />
            
            <text x="15" y="15" fill="#f8fafc" fontSize="10" fontWeight="bold">Portal App Server</text>
            <text x="15" y="63" fill="#f97316" fontSize="9" fontFamily="monospace">EC2 Instance</text>
          </g>

          {/* RDS Node inside Private Subnet 1A */}
          <g 
            transform="translate(195, 305)" 
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setActiveTooltip('rds')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <rect x="0" y="0" width="100" height="70" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            {/* Cylinder representation inside RDS rect */}
            <ellipse cx="50" cy="25" rx="20" ry="6" fill="#3b82f6" opacity="0.3" stroke="#3b82f6" strokeWidth="1" />
            <path d="M 30,25 V 50 A 20,6 0 0,0 70,50 V 25" fill="#3b82f6" opacity="0.3" stroke="#3b82f6" strokeWidth="1" />
            <ellipse cx="50" cy="38" rx="20" ry="6" fill="none" stroke="#3b82f6" strokeWidth="1" />
            <text x="50" y="63" fill="#3b82f6" fontSize="10" fontWeight="bold" textAnchor="middle">RDS PostgreSQL</text>
          </g>

          {/* Simulated Traffic flows */}
          
          {/* Flow 1: External Client -> IGW */}
          <path d="M 0,242.5 L 30,242.5" stroke={clientToWebColor} strokeWidth="2" markerEnd={clientToWebColor === '#ef4444' ? 'url(#arrow-red)' : 'url(#arrow-green)'} strokeDasharray="4 2" />
          <text x="5" y="233" fill={clientToWebColor} fontSize="9" fontWeight="bold">HTTP/S Request</text>

          {/* Flow 2: SSH Client -> IGW */}
          <path d="M 0,255 C 20,270 15,255 30,255" stroke={sshToWebColor} strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="5" y="278" fill={rules.ssh.allowed ? '#f59e0b' : '#64748b'} fontSize="9" fontWeight="bold">SSH Port 22</text>

          {/* Flow 3: IGW -> EC2 Web App (via subnet routing) */}
          <path 
            d="M 75,242.5 C 100,242.5 120,175 195,175" 
            stroke={clientToWebColor} 
            strokeWidth="2" 
            fill="none" 
            markerEnd={clientToWebColor === '#ef4444' ? 'url(#arrow-red)' : 'url(#arrow-green)'} 
          />

          {/* Flow 4: EC2 -> RDS PostgreSQL Database */}
          <path 
            d="M 245,210 L 245,305" 
            stroke={webToRdsColor} 
            strokeWidth="2.5" 
            fill="none" 
            strokeDasharray="5"
            markerEnd="url(#arrow)"
          >
            <animate attributeName="stroke-dashoffset" values="50;0" dur="1.5s" repeatCount="indefinite" />
          </path>
          <text x="252" y="260" fill="#60a5fa" fontSize="9" fontFamily="monospace">Query Port 5432</text>

          {/* Flow 5: EC2 -> S3 Storage Endpoint (Gateway routing) */}
          <path 
            d="M 295,175 C 450,175 520,245 615,245" 
            stroke="#f97316" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="5"
          >
            <animate attributeName="stroke-dashoffset" values="50;0" dur="2.5s" repeatCount="indefinite" />
          </path>
          <text x="460" y="165" fill="#f97316" fontSize="9" fontFamily="monospace">Private Link</text>

          {/* Flow 6: VPC Endpoint -> S3 bucket */}
          <path 
            d="M 645,245 L 710,232" 
            stroke="#f97316" 
            strokeWidth="2" 
            fill="none" 
            markerEnd="url(#arrow)"
          />

          {/* VULNERABILITY ALERT: Direct DB internet access */}
          {rules.database.allowed && (
            <>
              {/* Threat actor connecting directly to DB */}
              <path d="M 0,340 C 80,340 100,340 195,340" stroke="#ef4444" strokeWidth="2" fill="none" markerEnd="url(#arrow-red)" strokeDasharray="3 3" />
              <text x="5" y="333" fill="#ef4444" fontSize="9" fontWeight="bold">⚠️ RDS PORT 5432 OPEN TO INTERNET</text>
            </>
          )}

          {/* Tooltip Hover Display */}
          {activeTooltip && (
            <g transform="translate(250, 20)">
              <rect x="0" y="0" width="300" height="85" rx="6" fill="#1e293b" stroke="#c5a880" strokeWidth="1.5" />
              <text x="15" y="20" fill="#c5a880" fontSize="12" fontWeight="bold">{tooltips[activeTooltip].title}</text>
              {tooltips[activeTooltip].details.split('\n').map((line, idx) => (
                <text key={idx} x="15" y={40 + (idx * 14)} fill="#f1f5f9" fontSize="10" fontFamily="sans-serif">{line}</text>
              ))}
            </g>
          )}
        </svg>

        {/* Console Health Stats Footer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginTop: '1.25rem',
          backgroundColor: '#071120',
          padding: '1rem',
          borderRadius: '6px',
          border: '1px solid #14253d',
          fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ color: '#94a3b8' }}>EC2 CPU Utilization</div>
            <div style={{ color: ec2.cpuPercent > 70 ? 'var(--danger)' : '#10b981', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Cpu size={14} />
              <span>{ec2.cpuPercent}%</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8' }}>RDS Connection Status</div>
            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Database size={14} />
              <span>{rds.activeConnections} Connections</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8' }}>S3 Bucket Data Size</div>
            <div style={{ color: '#f97316', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <HardDrive size={14} />
              <span>{s3.storageFormatted} ({s3.objectCount} files)</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8' }}>VPC Security Status</div>
            {rules.database.allowed || rules.ssh.allowed ? (
              <div style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldAlert size={14} />
                <span>Exposed Ports</span>
              </div>
            ) : (
              <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={14} />
                <span>Fully Secure (VPC)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Firewall Controls */}
      <div className="aws-sidebar">
        <div className="rules-panel glass-panel" style={{ color: 'var(--text-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>
            <Key size={18} className="text-warning" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>VPC Security Group Rules</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Toggling these controls edits the inbound access list of the EC2 and RDS nodes. This updates the firewall configuration and logs the IAM action.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.keys(rules).map(key => {
              const rule = rules[key];
              return (
                <div key={key} className="rule-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      Port {rule.port} - {key.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {rule.desc}
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={rule.allowed} 
                      onChange={() => onToggleRule(key)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              );
            })}
          </div>

          {(rules.database.allowed || rules.ssh.allowed) && (
            <div style={{
              marginTop: '1.25rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              color: 'var(--danger)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'start',
              gap: '0.5rem'
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Security Alert:</strong>
                {rules.database.allowed && " RDS PostgreSQL database port (5432) is directly open to public traffic. Databases should always remain in private subnets!"}
                {rules.ssh.allowed && " SSH Port 22 is open, exposing the virtual host to brute-force security threats."}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
