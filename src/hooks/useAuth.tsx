import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) {
        // Handle 401 errors specifically
        if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
          console.log("JWT expired, clearing session");
          await supabase.auth.signOut();
          setError("Session expirée, veuillez vous reconnecter");
          return;
        }
        throw error;
      }
      
      setProfile(profile);
      setError(null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Erreur lors du chargement du profil");
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("Auth state change:", event, !!session);
        
        // Handle sign out
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setError(null);
          setLoading(false);
          return;
        }

        // Handle token refresh
        if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
          setSession(session);
          setUser(session.user);
          setError(null);
          
          // Fetch profile after successful auth
          if (session?.user) {
            setTimeout(() => {
              fetchProfile(session.user.id).finally(() => {
                if (mounted) setLoading(false);
              });
            }, 0);
          } else {
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          if (error.message?.includes('JWT') || error.message?.includes('expired')) {
            await supabase.auth.signOut();
            setError("Session expirée, veuillez vous reconnecter");
          }
          setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error("Init auth error:", error);
        if (mounted) {
          setError("Erreur d'authentification");
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Erreur lors de la déconnexion");
        console.error("Logout error:", error);
      } else {
        toast.success("Déconnexion réussie");
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la déconnexion");
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, error, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};