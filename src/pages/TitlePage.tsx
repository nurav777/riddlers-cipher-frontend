import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import batmanBg from "@/assets/batman-bg.jpg";

const TitlePage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gotham-black">
      {/* Batman Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${batmanBg})` }}
      >
        <div className="absolute inset-0 bg-gotham-black/60" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-4xl mx-auto px-6">
          {/* Title with wave animation */}
          <div className={`mb-8 ${isVisible ? 'wave-up' : 'opacity-0'}`}>
            <h1 className="font-orbitron font-black text-6xl md:text-8xl text-gotham-white mb-4 tracking-wider">
              GOTHAM
              <span className="block text-gotham-red text-5xl md:text-7xl mt-2">
                CIPHER
              </span>
            </h1>
          </div>

          {/* Subtitle with delayed animation */}
          <div className={`mb-12 ${isVisible ? 'wave-up-delayed' : 'opacity-0'}`}>
            <p className="font-inter text-xl md:text-2xl text-gotham-white/90 leading-relaxed max-w-3xl mx-auto">
              The <span className="text-gotham-red font-semibold">Riddler</span> has returned to Gotham, 
              leaving behind a trail of cryptographic puzzles that only the 
              <span className="text-gotham-red font-semibold"> Dark Knight</span> can solve.
            </p>
          </div>


          {/* Call to action */}
          <div className={`${isVisible ? 'fade-slide-up' : 'opacity-0'}`} 
               style={{ animationDelay: '0.4s' }}>
            <Button 
              variant="gotham" 
              size="hero"
              onClick={handleLoginClick}
              className="text-xl font-orbitron font-black animate-pulse-glow"
            >
              Begin Investigation
            </Button>
          </div>
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gotham-black to-transparent z-5" />
    </div>
  );
};

export default TitlePage;