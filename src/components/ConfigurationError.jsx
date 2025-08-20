import React from 'react';
import { AlertTriangle, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const ConfigurationError = ({ error }) => {
  const [copied, setCopied] = React.useState(false);

  const envTemplate = `# Supabase Configuration (Required)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_NAME=KrishiSethu Inventory Management
REACT_APP_VERSION=1.0.0

# Build Configuration
GENERATE_SOURCEMAP=false
DISABLE_ESLINT_PLUGIN=true`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(envTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration Required</h1>
          <p className="text-gray-600">
            KrishiSethu needs to be configured with your Supabase credentials to work properly.
          </p>
        </div>

        {/* Error Details */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Configuration Error
            </CardTitle>
            <CardDescription className="text-red-700">
              {error?.message || 'Missing or invalid Supabase configuration'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Quick Setup Guide</CardTitle>
            <CardDescription>
              Follow these steps to configure KrishiSethu with your Supabase project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Create a Supabase Project</h3>
                <p className="text-sm text-gray-600 mt-1">
                  If you don't have one already, create a new project at Supabase.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open Supabase Dashboard
                </Button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Get Your API Credentials</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Go to Settings → API in your Supabase project dashboard.
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Copy the <strong>Project URL</strong></li>
                  <li>• Copy the <strong>anon/public key</strong></li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-blue-600">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Create .env File</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Create a <code className="bg-gray-100 px-1 rounded">.env</code> file in your project root with:
                </p>
                
                <div className="mt-3 relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    {envTemplate}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-gray-800 border-gray-600 hover:bg-gray-700"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-medium text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Replace Placeholder Values</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Replace the placeholder values with your actual Supabase credentials and restart the development server.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">?</span>
              </div>
              <div>
                <p className="font-medium text-blue-800">Need Help?</p>
                <p className="text-sm text-blue-700">
                  Check the README.md file or visit the Supabase documentation for detailed setup instructions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigurationError;
