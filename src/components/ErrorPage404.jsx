import React from 'react';
import { Button } from './ui/button';
import { Home, RefreshCw, Wifi, WifiOff } from 'lucide-react';

const ErrorPage404 = ({ 
  onNavigate, 
  type = 'notFound', // 'notFound' or 'noConnection'
  onRetry 
}) => {
  const isConnectionError = type === 'noConnection';

  const handleGoHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <section className="page_404">
      <div className="container">
        <div className="row">
          <div className="col-sm-12">
            <div className="col-sm-10 col-sm-offset-1 text-center">
              <div className="four_zero_four_bg">
                <h1 className="text-center">
                  {isConnectionError ? (
                    <div className="flex items-center justify-center gap-4">
                      <WifiOff className="h-20 w-20 text-red-500" />
                      <span>No Connection</span>
                    </div>
                  ) : (
                    '404'
                  )}
                </h1>
              </div>

              <div className="contant_box_404">
                <h3 className="h2">
                  {isConnectionError 
                    ? "Connection Lost" 
                    : "Look like you're lost"
                  }
                </h3>

                <p>
                  {isConnectionError 
                    ? "Please check your internet connection and try again!" 
                    : "The page you are looking for is not available!"
                  }
                </p>

                <div className="flex gap-4 justify-center mt-6">
                  <Button 
                    onClick={handleGoHome}
                    className="link_404 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go to Home
                  </Button>

                  {isConnectionError && (
                    <Button 
                      onClick={handleRetry}
                      variant="outline"
                      className="px-6 py-3 rounded-lg flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>

                {isConnectionError && (
                  <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                      <WifiOff className="h-5 w-5" />
                      <span className="font-medium">Connection Tips:</span>
                    </div>
                    <ul className="mt-2 text-sm text-red-600 space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• Verify your network settings</li>
                      <li>• Try refreshing the page</li>
                      <li>• Contact your network administrator if the problem persists</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page_404 {
          padding: 40px 0;
          background: #fff;
          font-family: 'Arvo', serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 15px;
        }

        .row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -15px;
        }

        .col-sm-12 {
          width: 100%;
          padding: 0 15px;
        }

        .col-sm-10 {
          width: 83.33333333%;
          margin: 0 auto;
        }

        .text-center {
          text-align: center;
        }

        .four_zero_four_bg {
          background-image: url(https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif);
          height: 400px;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .four_zero_four_bg h1 {
          font-size: 80px;
          color: #333;
          margin: 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .contant_box_404 {
          margin-top: -50px;
        }

        .contant_box_404 h3 {
          font-size: 32px;
          margin-bottom: 20px;
          color: #333;
        }

        .contant_box_404 p {
          font-size: 16px;
          color: #666;
          margin-bottom: 30px;
        }

        .link_404 {
          color: #fff !important;
          padding: 10px 20px;
          background: #39ac31;
          margin: 20px 0;
          display: inline-block;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.3s ease;
        }

        .link_404:hover {
          background: #2d8a26;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .four_zero_four_bg {
            height: 300px;
          }
          
          .four_zero_four_bg h1 {
            font-size: 60px;
          }
          
          .contant_box_404 h3 {
            font-size: 24px;
          }
          
          .col-sm-10 {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default ErrorPage404;
