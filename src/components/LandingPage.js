import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, BarChart3, Shield, Users, ArrowRight, CheckCircle, Star, Menu, X } from 'lucide-react';

// Custom CSS for 3D effects
const customStyles = `
  @import url("https://fonts.cdnfonts.com/css/devil-breeze");
  @import url("https://fonts.cdnfonts.com/css/poppins");

  .section {
    width: 100%;
    min-height: 100vh;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .content-fit {
    width: min(1200px, 90vw);
    margin: auto;
    min-height: 100vh;
    position: relative;
    padding-block: 10em;
  }

  #banner .title {
    color: #d1ff48;
    font-size: 11em;
    font-family: "devil breeze";
    font-weight: bold;
    position: relative;
    overflow: visible;
    text-align: center;
  }

  #banner .title::before {
    content: attr(data-before);
    position: absolute;
    z-index: -1;
    color: oklch(0.78 0.17 80.01 / 0.19);
    mask: linear-gradient(
      to bottom,
      #000 -80%,
      oklch(0 0 0/0),
      #000,
      oklch(0 0 0/0) 200%
    );
    transform: scaleY(-1) translateY(-0.44lh);
  }

  .section .decorate {
    position: fixed;
    z-index: -100;
    pointer-events: none;
  }

  #intro .content-fit {
    display: flex;
    gap: 30%;
    justify-content: space-between;
    align-items: center;
  }

  .section .number {
    font-family: "devil breeze";
    font-size: 15em;
    font-weight: bold;
  }

  .section .content-fit .title {
    font-family: "devil breeze";
    font-size: 5em;
    font-weight: bold;
  }

  #description .content-fit {
    padding-right: 30%;
  }

  #description .number {
    font-size: 5em;
  }

  #description .title {
    font-size: 7em;
    font-weight: 500;
  }

  #contact .content-fit {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    text-align: center;
  }

  #contact table {
    width: min(800px, 90vw);
    padding-top: 2em;
    font-size: 2em;
    margin: auto;
  }

  #contact table td {
    padding-block: 0.5em;
    border-bottom: 1px dashed #445022;
  }

  #contact table td:nth-child(1) {
    text-align: left;
    font-weight: 500;
  }

  #contact table td:nth-child(2) {
    text-align: right;
    font-weight: 200;
  }

  #contact .sign {
    font-size: 10em;
    font-family: "devil breeze";
    font-weight: bold;
    color: #d1ff48;
  }

  #container3D {
    position: fixed;
    inset: 0;
    z-index: 100;
    pointer-events: none;
  }

  /* Floating animation for background elements */
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
      opacity: 0.3;
    }
    50% {
      transform: translateY(-20px) rotate(180deg);
      opacity: 0.6;
    }
  }

  /* Additional background texture overlays */
  .section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(209, 255, 72, 0.03) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(115, 129, 75, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(209, 255, 72, 0.02) 0%, transparent 50%);
    pointer-events: none;
    z-index: -50;
  }

  /* Particle-like dots scattered across sections */
  .section::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(2px 2px at 20px 30px, rgba(209, 255, 72, 0.2), transparent),
      radial-gradient(2px 2px at 40px 70px, rgba(115, 129, 75, 0.3), transparent),
      radial-gradient(1px 1px at 90px 40px, rgba(209, 255, 72, 0.4), transparent),
      radial-gradient(1px 1px at 130px 80px, rgba(115, 129, 75, 0.2), transparent),
      radial-gradient(2px 2px at 160px 30px, rgba(209, 255, 72, 0.1), transparent);
    background-repeat: repeat;
    background-size: 200px 100px;
    pointer-events: none;
    z-index: -40;
    opacity: 0.6;
  }

  /* Organic vine-like patterns */
  #banner::before {
    background-image:
      linear-gradient(45deg, transparent 40%, rgba(209, 255, 72, 0.05) 50%, transparent 60%),
      linear-gradient(-45deg, transparent 40%, rgba(115, 129, 75, 0.08) 50%, transparent 60%);
  }

  /* Additional organic textures for different sections */
  #intro::before {
    background-image:
      radial-gradient(ellipse at top left, rgba(209, 255, 72, 0.04) 0%, transparent 50%),
      radial-gradient(ellipse at bottom right, rgba(115, 129, 75, 0.06) 0%, transparent 50%);
  }

  #description::before {
    background-image:
      conic-gradient(from 45deg at 30% 70%, transparent 0deg, rgba(209, 255, 72, 0.03) 90deg, transparent 180deg),
      radial-gradient(circle at 80% 20%, rgba(115, 129, 75, 0.05) 0%, transparent 60%);
  }

  #contact::before {
    background-image:
      radial-gradient(ellipse at center, rgba(209, 255, 72, 0.06) 0%, transparent 70%),
      linear-gradient(135deg, transparent 30%, rgba(115, 129, 75, 0.04) 50%, transparent 70%);
  }

  @media screen and (max-width: 1023px) {
    #banner .title {
      font-size: 5em;
    }
    #intro .content-fit {
      flex-direction: column;
    }
  }

  @media screen and (max-width: 767px) {
    #banner .title {
      font-size: 3em;
    }
    #intro .content-fit {
      flex-direction: column;
    }
    .section .number {
      font-size: 5em;
    }
    .section .content-fit .title {
      font-size: 2em;
    }
    #description .content-fit {
      padding-right: 0;
    }
    #contact table {
      font-size: 1em;
    }
    #contact .sign {
      font-size: 2em;
    }
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Inject custom styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);

    // Set body styles to match original
    document.body.style.margin = '0';
    document.body.style.fontFamily = '"Montserrat", sans-serif';
    document.body.style.backgroundColor = '#1b1b1b';
    document.body.style.color = '#eef8ce';
    document.body.style.fontSize = '14px';
    document.body.style.backgroundImage = 'url(https://assets.codepen.io/453571/bg.avif), repeating-linear-gradient(to right, transparent 0 500px, #73814b33 500px 501px)';
    document.body.style.backgroundSize = '100%';

    // Load Three.js and initialize 3D scene
    const loadThreeJS = async () => {
      try {
        // Load Three.js modules
        const THREE = await import('https://cdn.skypack.dev/three@0.129.0/build/three.module.js');
        const { GLTFLoader } = await import('https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js');
        const { gsap } = await import('https://cdn.skypack.dev/gsap');

        // Initialize 3D scene
        const camera = new THREE.PerspectiveCamera(
          10,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 13;

        const scene = new THREE.Scene();
        let bee;

        // Load the realistic bee model
        let mixer;
        const loader = new GLTFLoader();

        // Load the bee GLB model
        loader.load(
          "https://raw.githubusercontent.com/DennysDionigi/bee-glb/94253437c023643dd868592e11a0fd2c228cfe07/demon_bee_full_texture.glb",
          function (gltf) {
            bee = gltf.scene;
            scene.add(bee);

            // Set up animation mixer for wing animations
            mixer = new THREE.AnimationMixer(bee);
            if (gltf.animations && gltf.animations.length > 0) {
              mixer.clipAction(gltf.animations[0]).play();
            }

            // Initialize model positioning
            modelMove();
          },
          function (xhr) {
            // Progress callback
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
          },
          function (error) {
            // Error callback - fallback to simple model
            console.error("Error loading bee model:", error);
            console.log("Loading fallback model...");

            // Create a simple bee-like fallback model
            const group = new THREE.Group();

            // Body
            const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            const bodyMaterial = new THREE.MeshPhongMaterial({
              color: 0xFFD700,
              shininess: 100
            });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            group.add(body);

            // Wings
            const wingGeometry = new THREE.PlaneGeometry(1.5, 0.8);
            const wingMaterial = new THREE.MeshPhongMaterial({
              color: 0xFFFFFF,
              transparent: true,
              opacity: 0.6
            });

            const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
            leftWing.position.set(-0.8, 0.2, 0);
            leftWing.rotation.z = 0.3;
            group.add(leftWing);

            const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
            rightWing.position.set(0.8, 0.2, 0);
            rightWing.rotation.z = -0.3;
            group.add(rightWing);

            bee = group;
            scene.add(bee);
            modelMove();
          }
        );

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const container = document.getElementById('container3D');
        if (container) {
          container.appendChild(renderer.domElement);
        }

        // Lighting setup matching the original bee demo
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
        scene.add(ambientLight);

        const topLight = new THREE.DirectionalLight(0xffffff, 1);
        topLight.position.set(500, 500, 500);
        scene.add(topLight);

        // Animation loop with bee wing animations
        const reRender3D = () => {
          requestAnimationFrame(reRender3D);

          // Update bee wing animations
          if (mixer) {
            mixer.update(0.02);
          }

          renderer.render(scene, camera);
        };
        reRender3D();

        // Position configurations for different sections
        const arrPositionModel = [
          {
            id: "banner",
            position: { x: 0, y: -1, z: 0 },
            rotation: { x: 0, y: 1.5, z: 0 }
          },
          {
            id: "intro",
            position: { x: 1, y: -1, z: -5 },
            rotation: { x: 0.5, y: -0.5, z: 0.5 }
          },
          {
            id: "description",
            position: { x: -1, y: -1, z: -5 },
            rotation: { x: 0, y: 0.5, z: 0.2 }
          },
          {
            id: "contact",
            position: { x: 0.45, y: -2, z: -10 },
            rotation: { x: 0.2, y: -0.5, z: -0.2 }
          }
        ];

        // Model movement based on scroll
        const modelMove = () => {
          const sections = document.querySelectorAll('.section');
          let currentSection;
          sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 3) {
              currentSection = section.id;
            }
          });

          const position_active = arrPositionModel.findIndex(
            (val) => val.id === currentSection
          );

          if (position_active >= 0 && bee) {
            const new_coordinates = arrPositionModel[position_active];
            gsap.to(bee.position, {
              x: new_coordinates.position.x,
              y: new_coordinates.position.y,
              z: new_coordinates.position.z,
              duration: 3,
              ease: "power1.out"
            });
            gsap.to(bee.rotation, {
              x: new_coordinates.rotation.x,
              y: new_coordinates.rotation.y,
              z: new_coordinates.rotation.z,
              duration: 3,
              ease: "power1.out"
            });
          }
        };

        // Scroll event listener
        const handleScroll = () => {
          if (bee) {
            modelMove();
          }
        };

        window.addEventListener('scroll', handleScroll);

        // Resize handler
        const handleResize = () => {
          renderer.setSize(window.innerWidth, window.innerHeight);
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleResize);
          if (container && renderer.domElement) {
            container.removeChild(renderer.domElement);
          }
        };

      } catch (error) {
        console.error('Error loading Three.js:', error);
      }
    };

    loadThreeJS();

    return () => {
      document.head.removeChild(styleElement);
      // Reset body styles
      document.body.style.margin = '';
      document.body.style.fontFamily = '';
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
      document.body.style.fontSize = '';
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
    };
  }, []);

  const heroBackgrounds = [
    '/AdobeStock_215401104.jpeg',
    '/AdobeStock_261294544.jpeg',
    '/AdobeStock_331588650.jpeg',
    '/2569.jpg',
    '/composition-compost-made-rotten-food-2048x1429.jpeg',
    '/top-view-veggies-with-salad-tool.jpg'
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Cycle through hero backgrounds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) =>
        (prevIndex + 1) % heroBackgrounds.length
      );
    }, 5000); // Change background every 5 seconds

    return () => clearInterval(interval);
  }, [heroBackgrounds.length]);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-green-100 transition-all duration-300 shadow-lg" style={{ zIndex: 100 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-2">
              <img
                src="/Logo_Horizontal_sidebar.png"
                alt="KrishiSethu Logo"
                className="h-24 w-auto"
                style={{
                  background: 'transparent',
                  backgroundColor: 'transparent'
                }}
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-green-700 hover:text-green-900 transition-colors">Features</button>
              <button onClick={() => scrollToSection('benefits')} className="text-green-700 hover:text-green-900 transition-colors">Benefits</button>
              <button onClick={() => scrollToSection('gallery')} className="text-green-700 hover:text-green-900 transition-colors">Gallery</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-green-700 hover:text-green-900 transition-colors">Reviews</button>
              <button
                onClick={() => navigate('/login')}
                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
              >
                Login
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-green-700 hover:text-green-900 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-green-100">
              <div className="px-4 py-2 space-y-2">
                <button
                  onClick={() => {
                    scrollToSection('features');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-green-700 hover:text-green-900 py-2 transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection('benefits');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-green-700 hover:text-green-900 py-2 transition-colors"
                >
                  Benefits
                </button>
                <button
                  onClick={() => {
                    scrollToSection('gallery');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-green-700 hover:text-green-900 py-2 transition-colors"
                >
                  Gallery
                </button>
                <button
                  onClick={() => {
                    scrollToSection('testimonials');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-green-700 hover:text-green-900 py-2 transition-colors"
                >
                  Reviews
                </button>
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-all duration-300 mt-2"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cycling Hero Backgrounds */}
        <div className="absolute inset-0 z-0">
          {heroBackgrounds.map((bg, index) => (
            <div
              key={bg}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentBgIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url('${bg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          ))}

          {/* Gradient Overlay - reduced opacity to show images better */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/50 to-emerald-800/40"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 z-10">
          <div 
            className="absolute top-20 left-10 w-20 h-20 bg-green-400/20 rounded-full blur-xl"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          ></div>
          <div 
            className="absolute top-40 right-20 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          ></div>
          <div 
            className="absolute bottom-20 left-1/4 w-24 h-24 bg-lime-400/20 rounded-full blur-xl"
            style={{ transform: `translateY(${scrollY * 0.4}px)` }}
          ></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div
            className="hero-content transform transition-all duration-1000"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              opacity: Math.max(0, 1 - scrollY / 500)
            }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight hero-title">
              Optimize Your
              <span className="block text-green-300">Business Operations</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Advanced inventory management platform that streamlines operations, reduces costs, and maximizes profitability for agricultural enterprises
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={() => navigate('/login')}
                className="bg-green-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-600 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-2"
              >
                <span>Start Your Journey</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-800 transition-all duration-300 transform hover:scale-105"
              >
                Explore Features
              </button>
            </div>

            {/* Background Indicators */}
            <div className="flex justify-center space-x-4">
              {heroBackgrounds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBgIndex(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-500 border-2 border-white/30 ${
                    index === currentBgIndex
                      ? 'bg-green-300 scale-125 bg-indicator-active border-green-300'
                      : 'bg-white/30 hover:bg-white/60 hover:scale-110'
                  }`}
                  aria-label={`Switch to background ${index + 1}`}
                >
                  <span className="sr-only">Background {index + 1}</span>
                </button>
              ))}
            </div>

            {/* Background Labels */}
            <div className="mt-4 text-center">
              <p className="text-green-100 text-sm font-medium">
                {currentBgIndex === 0 && "Agricultural Innovation"}
                {currentBgIndex === 1 && "Smart Technology"}
                {currentBgIndex === 2 && "Sustainable Solutions"}
                {currentBgIndex === 3 && "Modern Farming"}
                {currentBgIndex === 4 && "Organic Composting"}
                {currentBgIndex === 5 && "Fresh Produce"}
              </p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="animate-bounce">
            <ChevronDown className="h-8 w-8 text-white" />
          </div>
        </div>
      </section>

      {/* 3D Animation Section - Banner */}
      <section
        id="banner"
        className="section relative min-h-screen text-white overflow-hidden"
        style={{
          backgroundColor: '#1b1b1b',
          color: '#eef8ce',
          backgroundImage: `url(https://assets.codepen.io/453571/bg.avif), repeating-linear-gradient(to right, transparent 0 500px, #73814b33 500px 501px)`,
          backgroundSize: '100%'
        }}
      >
        <div className="content-fit flex items-center justify-center">
          <div
            className="title"
            data-before="KRISHISETHU"
          >
            KRISHISETHU
          </div>
        </div>

        {/* Original decorative images from bee demo */}
        <img
          src="https://assets.codepen.io/453571/flower.png"
          className="decorate"
          alt=""
          style={{ width: '50vw', bottom: 0, right: 0, position: 'fixed', zIndex: -100, pointerEvents: 'none' }}
        />
        <img
          src="https://assets.codepen.io/453571/leaf.png"
          className="decorate"
          alt=""
          style={{ width: '30vw', bottom: 0, left: 0, position: 'fixed', zIndex: -100, pointerEvents: 'none' }}
        />

        {/* Additional background decorative elements */}
        <div
          className="decorate"
          style={{
            position: 'fixed',
            top: '10%',
            left: '5%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(209, 255, 72, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: -100,
            pointerEvents: 'none'
          }}
        />
        <div
          className="decorate"
          style={{
            position: 'fixed',
            top: '60%',
            right: '10%',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(115, 129, 75, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: -100,
            pointerEvents: 'none'
          }}
        />
        <div
          className="decorate"
          style={{
            position: 'fixed',
            top: '30%',
            right: '20%',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(209, 255, 72, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: -100,
            pointerEvents: 'none'
          }}
        />
      </section>

      {/* 3D Animation Section - Intro */}
      <section
        id="intro"
        className="section relative min-h-screen text-white"
        style={{
          backgroundColor: '#1b1b1b',
          color: '#eef8ce',
          backgroundImage: `url(https://assets.codepen.io/453571/bg.avif), repeating-linear-gradient(to right, transparent 0 500px, #73814b33 500px 501px)`,
          backgroundSize: '100%'
        }}
      >
        <div className="content-fit flex gap-8 justify-between items-center">
          <div className="number opacity-30">
            01
          </div>
          <div className="des flex-1">
            <div className="title mb-6">
              INVENTORY MANAGEMENT FEATURES
            </div>
            <div className="text-green-100 text-lg leading-relaxed space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-yellow-300">Real-Time Stock Tracking:</strong> Monitor seeds, fertilizers, pesticides, and equipment inventory levels with live updates and automated alerts for low stock.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-yellow-300">Smart Analytics Dashboard:</strong> Get insights on consumption patterns, seasonal trends, and predictive analytics for optimal procurement planning.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-yellow-300">Automated Reorder System:</strong> Set minimum stock levels and receive automatic purchase recommendations based on usage patterns and seasonal requirements.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-yellow-300">Batch & Expiry Management:</strong> Track product batches, expiration dates, and ensure FIFO (First In, First Out) inventory rotation to minimize waste.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-yellow-300">Multi-Location Support:</strong> Manage inventory across multiple farms, warehouses, and storage facilities from a single centralized platform.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Animation Section - Description */}
      <section
        id="description"
        className="section relative min-h-screen text-white"
        style={{
          backgroundColor: '#1b1b1b',
          color: '#eef8ce',
          backgroundImage: `url(https://assets.codepen.io/453571/bg.avif), repeating-linear-gradient(to right, transparent 0 500px, #73814b33 500px 501px)`,
          backgroundSize: '100%'
        }}
      >
        <div className="content-fit pr-0 md:pr-[30%]">
          <div className="number opacity-30 mb-8">
            02
          </div>
          <div className="des">
            <div className="title mb-6">
              SMART FARMING
            </div>
            <p className="text-green-100 text-lg leading-relaxed">
              KrishiSethu revolutionizes agricultural inventory management with cutting-edge technology and
              intelligent automation. Our platform empowers farmers and agricultural businesses to optimize
              their operations, reduce waste, and maximize profitability through data-driven insights and
              real-time monitoring. From seed to harvest, track every aspect of your agricultural journey
              with precision and ease. Experience the future of farming with our comprehensive inventory
              management solution designed specifically for the agricultural sector.
            </p>
          </div>
        </div>
        <img
          src="https://assets.codepen.io/453571/leaf1.png"
          className="decorate"
          alt=""
          style={{ width: '70vw', bottom: 0, right: 0, position: 'fixed', zIndex: -100, pointerEvents: 'none' }}
        />

        {/* Additional floating background elements */}
        <div
          className="decorate"
          style={{
            position: 'fixed',
            top: '20%',
            left: '80%',
            width: '80px',
            height: '80px',
            background: 'radial-gradient(circle, rgba(209, 255, 72, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: -100,
            pointerEvents: 'none',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div
          className="decorate"
          style={{
            position: 'fixed',
            top: '70%',
            left: '15%',
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(115, 129, 75, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            zIndex: -100,
            pointerEvents: 'none',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="section relative min-h-screen text-white"
        style={{
          backgroundColor: '#1b1b1b',
          color: '#eef8ce',
          backgroundImage: `url(https://assets.codepen.io/453571/bg.avif), repeating-linear-gradient(to right, transparent 0 500px, #73814b33 500px 501px)`,
          backgroundSize: '100%'
        }}
      >
        <div className="content-fit flex flex-col justify-center items-center text-center">
          <div className="number opacity-30 mb-8">
            03
          </div>
          <div className="des">
            <div className="title mb-8">
              CONTACT
            </div>
            <table className="w-full max-w-4xl mx-auto text-2xl mb-8">
              <tbody>
                <tr>
                  <td className="text-left font-medium py-4 border-b border-dashed border-green-700">Email</td>
                  <td className="text-right font-light py-4 border-b border-dashed border-green-700">arjunin2020@gmail.com</td>
                </tr>
                <tr>
                  <td className="text-left font-medium py-4 border-b border-dashed border-green-700">Phone</td>
                  <td className="text-right font-light py-4 border-b border-dashed border-green-700">+91 9963600975</td>
                </tr>
                <tr>
                  <td className="text-left font-medium py-4 border-b border-dashed border-green-700">Website</td>
                  <td className="text-right font-light py-4 border-b border-dashed border-green-700">krishisethu.com</td>
                </tr>
                <tr>
                  <td className="text-left font-medium py-4 border-b border-dashed border-green-700">Support</td>
                  <td className="text-right font-light py-4 border-b border-dashed border-green-700">24/7 Available</td>
                </tr>
              </tbody>
            </table>
            <div className="sign">
              KRISHISETHU
            </div>
          </div>
        </div>
      </section>

      {/* Global background decorative elements */}
      <div className="decorate" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: `
          radial-gradient(circle at 10% 20%, rgba(209, 255, 72, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 90% 80%, rgba(115, 129, 75, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(209, 255, 72, 0.03) 0%, transparent 70%)
        `,
        zIndex: -200,
        pointerEvents: 'none'
      }} />

      {/* Animated background particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="decorate"
          style={{
            position: 'fixed',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 60 + 20}px`,
            height: `${Math.random() * 60 + 20}px`,
            background: `radial-gradient(circle, rgba(209, 255, 72, ${Math.random() * 0.1 + 0.02}) 0%, transparent 70%)`,
            borderRadius: '50%',
            zIndex: -150,
            pointerEvents: 'none',
            animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`
          }}
        />
      ))}

      {/* 3D Container for Three.js */}
      <div id="container3D"></div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              isVisible.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-green-800 mb-6">
              Powerful Features for Modern Agriculture
            </h2>
            <p className="text-xl text-green-600 max-w-3xl mx-auto">
              Streamline your fertilizer management with cutting-edge technology designed for efficiency and growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                description: "Track inventory levels, usage patterns, and optimize your fertilizer distribution with advanced analytics",
                delay: "0ms",
                image: "/realtime_analytics.jpeg",
                flipDirection: "left"
              },
              {
                icon: Shield,
                title: "Secure Management",
                description: "Enterprise-grade security ensures your data is protected with role-based access controls",
                delay: "200ms",
                image: "/security_management.jpg",
                flipDirection: "right"
              },
              {
                icon: Users,
                title: "Multi-user Support",
                description: "Collaborate seamlessly with your team, suppliers, and distributors in one unified platform",
                delay: "400ms",
                image: "/vecteezy_friendly-young-woman-providing-excellent-customer-service-in_47268899.jpeg",
                flipDirection: "left"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`feature-card bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 ${
                  isVisible.features
                    ? `translate-y-0 opacity-100 ${feature.flipDirection === 'left' ? 'flip-in-left' : 'flip-in-right'}`
                    : 'translate-y-10 opacity-0'
                }`}
                style={{
                  transitionDelay: feature.delay,
                  transform: `translateY(${scrollY * 0.05}px)`
                }}
              >
                <div className="relative overflow-hidden rounded-t-2xl h-48">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 to-transparent"></div>
                  <div className="absolute top-4 left-4 bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-green-800 mb-3">{feature.title}</h3>
                  <p className="text-green-600 leading-relaxed text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-30 -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-100 rounded-full blur-2xl opacity-40 translate-y-24 -translate-x-24"></div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-green-800 to-emerald-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className={`transform transition-all duration-1000 ${
                isVisible.benefits ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                Why Choose KrishiSethu?
              </h2>
              <div className="space-y-6">
                {[
                  "Reduce inventory costs by up to 30%",
                  "Eliminate stockouts and overstock situations",
                  "Improve crop yield with optimal fertilizer management",
                  "Streamline supplier relationships",
                  "Generate detailed compliance reports"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-green-100 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`transform transition-all duration-1000 ${
                isVisible.benefits ? 'translate-x-0 opacity-100 flip-in-right' : 'translate-x-10 opacity-0'
              }`}
              style={{ transform: `translateY(${scrollY * 0.03}px)` }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="relative overflow-hidden rounded-2xl mb-6 group">
                  <img
                    src="/2151908084.jpg"
                    alt="Smart farming with advanced technology"
                    className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Smart Inventory Management</h3>
                <p className="text-green-100">
                  Experience the future of agricultural inventory management with AI-powered insights and automated workflows.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-emerald-300/10 rounded-full blur-xl"></div>
      </section>

      {/* Image Gallery Section */}
      <section id="gallery" className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              isVisible.gallery ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-green-800 mb-6">
              Modern Agriculture in Action
            </h2>
            <p className="text-xl text-green-600 max-w-3xl mx-auto">
              See how technology is transforming farming and fertilizer management across the globe
            </p>
          </div>

          <div className="space-y-16">
            {/* First Row - Left Image, Right Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div
                className={`transform transition-all duration-1000 ${
                  isVisible.gallery ? 'translate-x-0 opacity-100 flip-in-left' : '-translate-x-10 opacity-0'
                }`}
              >
                <div className="relative group overflow-hidden rounded-3xl">
                  <img
                    src="/agrifac_precision.jpg"
                    alt="Advanced agricultural technology and farming"
                    className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xl font-bold mb-2">Digital Farming</h4>
                    <p className="text-green-100">Technology meets agriculture</p>
                  </div>
                </div>
              </div>
              <div
                className={`transform transition-all duration-1000 ${
                  isVisible.gallery ? 'translate-x-0 opacity-100 flip-in-right' : 'translate-x-10 opacity-0'
                }`}
              >
                <h3 className="text-3xl font-bold text-green-800 mb-6">Precision Agriculture</h3>
                <p className="text-green-600 text-lg leading-relaxed mb-6">
                  Leverage cutting-edge technology to optimize fertilizer application, monitor crop health,
                  and maximize yield while minimizing environmental impact.
                </p>
                <ul className="space-y-3">
                  {[
                    "GPS-guided fertilizer application",
                    "Soil nutrient analysis and mapping",
                    "Weather-based application timing",
                    "Crop health monitoring systems"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-green-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Second Row - Right Image, Left Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div
                className={`lg:order-2 transform transition-all duration-1000 ${
                  isVisible.gallery ? 'translate-x-0 opacity-100 flip-in-right' : 'translate-x-10 opacity-0'
                }`}
              >
                <div className="relative group overflow-hidden rounded-3xl">
                  <img
                    src="/vecna_analytics.jpg"
                    alt="Smart inventory management and analytics"
                    className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xl font-bold mb-2">Smart Warehousing</h4>
                    <p className="text-green-100">Automated inventory tracking</p>
                  </div>
                </div>
              </div>
              <div
                className={`lg:order-1 transform transition-all duration-1000 ${
                  isVisible.gallery ? 'translate-x-0 opacity-100 flip-in-left' : '-translate-x-10 opacity-0'
                }`}
              >
                <h3 className="text-3xl font-bold text-green-800 mb-6">Intelligent Inventory</h3>
                <p className="text-green-600 text-lg leading-relaxed mb-6">
                  Streamline your fertilizer storage and distribution with automated tracking systems,
                  real-time stock monitoring, and predictive analytics.
                </p>
                <ul className="space-y-3">
                  {[
                    "Automated stock level monitoring",
                    "Predictive reorder notifications",
                    "Quality control and expiry tracking",
                    "Multi-location inventory sync"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-green-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Third Row - Left Image, Right Content */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div
                className={`transform transition-all duration-1000 ${
                  isVisible.gallery ? 'translate-x-0 opacity-100 flip-in-left' : '-translate-x-10 opacity-0'
                }`}
              >
                <div className="relative group overflow-hidden rounded-3xl">
                  <img
                    src="/AdobeStock_331588650.jpeg"
                    alt="Sustainable farming and technology integration"
                    className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xl font-bold mb-2">Sustainable Farming</h4>
                    <p className="text-green-100">Eco-friendly agriculture</p>
                  </div>
                </div>
              </div>
              <div
                className={`transform transition-all duration-1000 ${
                  isVisible.gallery ? 'translate-x-0 opacity-100 flip-in-right' : 'translate-x-10 opacity-0'
                }`}
              >
                <h3 className="text-3xl font-bold text-green-800 mb-6">Sustainable Solutions</h3>
                <p className="text-green-600 text-lg leading-relaxed mb-6">
                  Promote environmental sustainability while maintaining high productivity through
                  optimized fertilizer usage and eco-friendly farming practices.
                </p>
                <ul className="space-y-3">
                  {[
                    "Reduced chemical runoff and pollution",
                    "Optimized nutrient application rates",
                    "Soil health improvement tracking",
                    "Carbon footprint reduction metrics"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-green-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-20 translate-x-32"></div>
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-emerald-100 rounded-full blur-2xl opacity-30 -translate-x-24"></div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-green-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-16 transform transition-all duration-1000 ${
              isVisible.testimonials ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-green-800 mb-6">
              Trusted by Farmers Worldwide
            </h2>
            <p className="text-xl text-green-600 max-w-3xl mx-auto">
              Join thousands of satisfied customers who have transformed their agricultural operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Gopal K",
                role: "Fertilizer Dealer",
                content: "KrishiSethu has revolutionized how I manage my fertilizer inventory. The analytics help me make better decisions and save costs.",
                rating: 5,
                image: "/AdobeStock_215401104.jpeg",
                flipDirection: "left"
              },
              {
                name: "ParsuRam",
                role: "Fertilizer Retailer",
                content: "The multi-user support and real-time tracking features have made collaboration with my clients seamless and efficient.",
                rating: 5,
                image: "/AdobeStock_261294544.jpeg",
                flipDirection: "right"
              },
              {
                name: "Shiva Kumar",
                role: "Fertilizer Shop Owner",
                content: "Managing inventory across multiple locations was a nightmare. KrishiSethu made it simple and automated our entire workflow.",
                rating: 5,
                image: "/AdobeStock_331588650.jpeg",
                flipDirection: "left"
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className={`testimonial-card bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-700 transform hover:-translate-y-2 ${
                  isVisible.testimonials
                    ? `translate-y-0 opacity-100 ${testimonial.flipDirection === 'left' ? 'flip-in-left' : 'flip-in-right'}`
                    : 'translate-y-10 opacity-0'
                }`}
                style={{
                  transitionDelay: `${index * 200}ms`,
                  transform: `translateY(${scrollY * 0.02}px)`
                }}
              >
                <div className="flex items-center mb-6">
                  <div className="relative group">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 rounded-full bg-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-800">{testimonial.name}</h4>
                    <p className="text-green-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section id="cta" className="py-20 bg-gradient-to-r from-green-600 to-emerald-700 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div
            className={`transform transition-all duration-1000 ${
              isVisible.cta ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Optimize Your Business?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of agricultural businesses who have already streamlined their operations and increased profitability with KrishiSethu
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/login')}
                className="bg-white text-green-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-green-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center space-x-2"
              >
                <span>Get Started Today</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-green-700 transition-all duration-300 transform hover:scale-105">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>

        {/* Background Animation */}
        <div className="absolute inset-0">
          <div
            className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          ></div>
          <div
            className="absolute bottom-10 right-10 w-32 h-32 bg-green-300/20 rounded-full blur-xl"
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-24 h-24 bg-emerald-200/20 rounded-full blur-lg transform -translate-x-1/2 -translate-y-1/2"
            style={{ transform: `translate(-50%, -50%) translateY(${scrollY * 0.08}px)` }}
          ></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="/Logo_Horizontal_sidebar.png"
                  alt="KrishiSethu Logo"
                  className="h-10 w-auto"
                  style={{
                    background: 'transparent',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
              <p className="text-green-200">
                Empowering farmers with intelligent inventory management solutions for a sustainable future.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-green-200">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors text-left">Features</button></li>
                <li><button className="hover:text-white transition-colors text-left">Pricing</button></li>
                <li><button className="hover:text-white transition-colors text-left">API</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-green-200">
                <li><button className="hover:text-white transition-colors text-left">Documentation</button></li>
                <li><button className="hover:text-white transition-colors text-left">Help Center</button></li>
                <li><button className="hover:text-white transition-colors text-left">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-green-200">
                <li><button className="hover:text-white transition-colors text-left">About</button></li>
                <li><button className="hover:text-white transition-colors text-left">Blog</button></li>
                <li><button className="hover:text-white transition-colors text-left">Careers</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-green-800 mt-8 pt-8 text-center text-green-200">
            <p>&copy; 2024 KrishiSethu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
