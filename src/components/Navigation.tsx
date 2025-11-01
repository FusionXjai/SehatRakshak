import { Button } from "@/components/ui/button";
import { Shield, Menu, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserName();
    } else {
      setUserName(null);
    }
  }, [user]);

  const fetchUserName = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserName(data.full_name);
      } else if (user.email) {
        // Fallback to email username
        setUserName(user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
      if (user.email) {
        setUserName(user.email.split('@')[0]);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out",
    });
    navigate('/');
  };

  const handleProfileClick = () => {
    // Navigate to user's dashboard based on role
    switch (userRole) {
      case 'receptionist':
        navigate('/reception');
        break;
      case 'doctor':
        navigate('/doctor');
        break;
      case 'hospitaladmin':
      case 'superadmin':
        navigate('/admin');
        break;
      case 'patient':
        navigate('/patient');
        break;
      case 'caremanager':
        navigate('/caremanager');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg">Sehat Rakshak</div>
              <div className="text-xs text-muted-foreground">आपकी सेहत, हमारा वचन</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <a href="/Contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div 
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{userName || 'User'}</span>
                    {userRole && (
                      <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link to="/features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/Contact" className="text-sm font-medium hover:text-primary transition-colors">
                Contact
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    <div 
                      onClick={handleProfileClick}
                      className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-2 cursor-pointer hover:bg-muted/80 transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{userName || 'User'}</span>
                        {userRole && (
                          <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                      Login
                    </Button>
                    <Button size="sm" onClick={() => navigate('/signup')}>
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;