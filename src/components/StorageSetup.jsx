import React, { useState } from 'react';
import { diagnoseAndSetup, verifyAllBuckets } from '../utils/setupStorage';
import { printDiagnosticReport } from '../utils/checkSupabaseConfig';

/**
 * Storage Setup Component
 * Provides UI for diagnosing and fixing storage issues
 */
const StorageSetup = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);

  const handleRunSetup = async () => {
    setIsRunning(true);
    setResults(null);
    
    try {
      console.log('🚀 Starting storage setup from UI...');
      const setupResults = await diagnoseAndSetup();
      setResults(setupResults);
      console.log('✅ Setup completed from UI');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      setResults({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics(null);
    
    try {
      console.log('🔍 Running diagnostics from UI...');
      const diagnosticResults = await printDiagnosticReport();
      setDiagnostics(diagnosticResults);
      console.log('✅ Diagnostics completed from UI');
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setDiagnostics({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleVerifyBuckets = async () => {
    setIsRunning(true);
    
    try {
      console.log('🔍 Verifying buckets from UI...');
      await verifyAllBuckets();
      console.log('✅ Verification completed from UI');
    } catch (error) {
      console.error('❌ Verification failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🛠️ Storage Setup & Diagnostics</h2>
      <p>Use this tool to diagnose and fix storage bucket issues.</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleRunDiagnostics}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '🔄 Running...' : '🔍 Run Diagnostics'}
        </button>
        
        <button 
          onClick={handleRunSetup}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '🔄 Running...' : '🚀 Auto Setup Storage'}
        </button>
        
        <button 
          onClick={handleVerifyBuckets}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '🔄 Running...' : '✅ Verify Buckets'}
        </button>
      </div>

      {/* Diagnostics Results */}
      {diagnostics && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px'
        }}>
          <h3>📋 Diagnostic Results</h3>
          {diagnostics.error ? (
            <div style={{ color: '#dc3545' }}>
              <strong>Error:</strong> {diagnostics.error}
            </div>
          ) : (
            <>
              {diagnostics.results && (
                <div>
                  <p><strong>Overall Status:</strong> <code>{diagnostics.results.overall}</code></p>
                  <p><strong>Project Connected:</strong> {diagnostics.results.project.connected ? '✅' : '❌'}</p>
                  <p><strong>User Authenticated:</strong> {diagnostics.results.auth.available ? '✅' : '❌'}</p>
                  
                  <h4>Storage Buckets:</h4>
                  <ul>
                    {Object.entries(diagnostics.results.storage.buckets).map(([name, info]) => (
                      <li key={name}>
                        {info.exists ? '✅' : '❌'} <strong>{name}</strong>
                        {info.error && <span style={{ color: '#dc3545' }}> - {info.error}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {diagnostics.instructions && diagnostics.instructions.length > 0 && (
                <div>
                  <h4>🔧 Setup Instructions:</h4>
                  {diagnostics.instructions.map((instruction, index) => (
                    <div key={index} style={{ marginBottom: '15px' }}>
                      <strong>[{instruction.priority}] {instruction.category}</strong>
                      <p style={{ margin: '5px 0', color: '#dc3545' }}>{instruction.issue}</p>
                      <ul style={{ margin: '0' }}>
                        {instruction.solution.map((step, stepIndex) => (
                          <li key={stepIndex} style={{ fontSize: '0.9em', color: '#495057' }}>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Setup Results */}
      {results && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: results.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${results.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px'
        }}>
          <h3>{results.success ? '✅' : '❌'} Setup Results</h3>
          {results.error ? (
            <div style={{ color: '#721c24' }}>
              <strong>Error:</strong> {results.error}
            </div>
          ) : (
            <>
              {results.buckets && (
                <div>
                  <h4>Buckets:</h4>
                  <ul>
                    {Object.entries(results.buckets).map(([name, info]) => (
                      <li key={name}>
                        {info.success ? (info.existed ? '⚠️' : '✅') : '❌'} <strong>{name}</strong>
                        {info.error && <span style={{ color: '#721c24' }}> - {info.error}</span>}
                        {info.existed && <span style={{ color: '#856404' }}> (already existed)</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {results.message && (
                <p style={{ fontStyle: 'italic', color: '#155724' }}>{results.message}</p>
              )}
              
              {results.errors && results.errors.length > 0 && (
                <div>
                  <h4>Errors:</h4>
                  <ul>
                    {results.errors.map((error, index) => (
                      <li key={index} style={{ color: '#721c24' }}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px'
      }}>
        <h4>📝 Important Notes:</h4>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>This tool can create storage buckets automatically</li>
          <li>Storage policies (RLS) need to be manually applied in the Supabase Dashboard</li>
          <li>Make sure you're logged in to the application before running setup</li>
          <li>Check the browser console for detailed logs during setup</li>
          <li>If buckets already exist, they won't be modified</li>
        </ul>
      </div>
    </div>
  );
};

export default StorageSetup;
