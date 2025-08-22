import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, Mail, Lock, Users, Building2 } from "lucide-react";

const Auth = () => {
  const [view, setView] = useState<"welcome" | "login" | "signup-client" | "signup-pro">("welcome");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    telephone: "",
    etablissement: "",
    siret: "",
  });
  
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      errors: {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
      }
    };
  };

  const validateSiret = (siret: string) => {
    const cleanSiret = siret.replace(/\s/g, "");
    return /^\d{14}$/.test(cleanSiret);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Veuillez confirmer votre email avant de vous connecter");
        } else {
          toast.error("Erreur de connexion: " + error.message);
        }
        return;
      }

      // Récupérer le profil de l'utilisateur pour déterminer le rôle
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      toast.success("Connexion réussie !");
      
      // Redirection selon le rôle
      if (profile?.role === "admin") {
        navigate("/pro");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite lors de la connexion");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nom: formData.nom,
            role: "client",
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Cet email est déjà utilisé");
        } else {
          toast.error("Erreur d'inscription: " + error.message);
        }
        return;
      }

      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
      setView("login");
    } catch (error) {
      toast.error("Une erreur s'est produite lors de l'inscription");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupPro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim() || !formData.email.trim() || !formData.password.trim() || 
        !formData.telephone.trim() || !formData.etablissement.trim() || !formData.siret.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      toast.error("Le mot de passe ne respecte pas les critères de sécurité");
      return;
    }

    if (!validateSiret(formData.siret)) {
      toast.error("Le numéro de SIRET doit contenir exactement 14 chiffres");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/pro`;
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nom: formData.nom,
            role: "admin",
            telephone: formData.telephone,
            etablissement: formData.etablissement,
            siret: formData.siret.replace(/\s/g, ""),
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error("Cet email est déjà utilisé");
        } else if (error.message.includes("SIRET")) {
          toast.error("Ce numéro de SIRET est déjà utilisé");
        } else {
          toast.error("Erreur d'inscription: " + error.message);
        }
        return;
      }

      toast.success("Inscription professionnelle réussie ! Vérifiez votre email pour confirmer votre compte.");
      setView("login");
    } catch (error) {
      toast.error("Une erreur s'est produite lors de l'inscription");
      console.error("Signup pro error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error("Veuillez saisir votre email");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error("Erreur lors de l'envoi de l'email de réinitialisation");
      } else {
        toast.success("Email de réinitialisation envoyé !");
      }
    } catch (error) {
      toast.error("Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl gradient-text">Pool Party</CardTitle>
          <CardDescription>
            Bienvenue sur la plateforme de gestion d'événements nightclub
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => setView("signup-pro")} 
            className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
            size="lg"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Vous êtes pro ? Cliquez ici
          </Button>
          
          <Separator className="my-4" />
          
          <Button 
            onClick={() => setView("login")} 
            variant="outline" 
            className="w-full"
            size="lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            Connexion
          </Button>
          
          <Button 
            onClick={() => setView("signup-client")} 
            variant="ghost" 
            className="w-full"
          >
            <Users className="w-4 h-4 mr-2" />
            Inscription client
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Mot de passe oublié ?
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setView("welcome")}>
              ← Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSignupClient = () => (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inscription Client</CardTitle>
          <CardDescription>Créez votre compte client</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignupClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                placeholder="Votre nom complet"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              S'inscrire
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setView("welcome")}>
              ← Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSignupPro = () => (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Inscription Professionnelle</CardTitle>
          <CardDescription>
            Rejoignez Pool Party et gérez vos événements nightclub de manière professionnelle. 
            Accédez à tous les outils de gestion : événements, tables, produits, commandes et analyses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignupPro} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                placeholder="Votre nom complet"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@votreclub.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe sécurisé *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Numéro de téléphone *</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="etablissement">Nom de l'établissement *</Label>
              <Input
                id="etablissement"
                placeholder="Le nom de votre nightclub"
                value={formData.etablissement}
                onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret">Numéro de SIRET *</Label>
              <Input
                id="siret"
                placeholder="12345678901234"
                value={formData.siret}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 14) {
                    setFormData({ ...formData, siret: value });
                  }
                }}
                required
              />
              <div className="text-xs text-muted-foreground">
                14 chiffres exactement - obligatoire pour l'inscription pro
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              S'inscrire en tant que professionnel
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => setView("welcome")}>
              ← Retour
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {view === "welcome" && renderWelcome()}
      {view === "login" && renderLogin()}
      {view === "signup-client" && renderSignupClient()}
      {view === "signup-pro" && renderSignupPro()}
    </>
  );
};

export default Auth;