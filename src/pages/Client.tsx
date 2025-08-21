import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  ArrowRight
} from "lucide-react";

export default function Client() {
  // Mock events data for clients
  const upcomingEvents = [
    {
      id: 1,
      title: "Pool Party VIP Summer",
      description: "Soirée exclusive en piscine avec DJs internationaux et ambiance tropical unique",
      date: "Ce soir",
      time: "22:00",
      location: "Terrasse VIP",
      image: "/api/placeholder/600/300",
      price: "Entrée à partir de 25€",
      rating: 4.8,
      category: "Pool Party"
    },
    {
      id: 2,
      title: "Latino Night Fever",
      description: "Nuit latine enflammée avec orchestre live, danseuses et cocktails exotiques",
      date: "Demain",
      time: "23:00",
      location: "Salle principale",
      image: "/api/placeholder/600/300",
      price: "Entrée à partir de 20€",
      rating: 4.6,
      category: "Latino"
    },
    {
      id: 3,
      title: "Electronic House Session",
      description: "Session house électrisante avec les meilleurs DJs de la scène underground",
      date: "Vendredi",
      time: "21:30",
      location: "Club principal",
      image: "/api/placeholder/600/300",
      price: "Entrée à partir de 30€",
      rating: 4.9,
      category: "Electronic"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
              ClubManager
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
              Découvrez les événements les plus exclusifs de la ville
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm">
                <Calendar className="w-5 h-5 mr-2" />
                Voir les événements
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm">
                <Users className="w-5 h-5 mr-2" />
                Réserver une table
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32 animate-pulse" />
      </div>

      {/* Events Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
              Événements à venir
            </h2>
            <p className="text-lg text-muted-foreground">
              Plongez dans l'ambiance unique de nos soirées exceptionnelles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="bg-card/80 backdrop-blur-sm border-border/50 hover:bg-card/90 transition-all duration-300 group overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-gradient-secondary rounded-t-lg flex items-center justify-center relative overflow-hidden">
                    <Calendar className="w-16 h-16 text-primary opacity-30" />
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 group-hover:opacity-30 transition-opacity" />
                  </div>
                  
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                    {event.category}
                  </Badge>
                  
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {event.rating}
                  </div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {event.date} à {event.time}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-accent">
                        {event.price}
                      </span>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-gradient-primary hover:opacity-90 shadow-glow group">
                    Découvrir l'événement
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-secondary/30 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Pourquoi choisir ClubManager ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <Calendar className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Événements exclusifs</h3>
                <p className="text-muted-foreground">
                  Accédez aux soirées les plus privées et événements VIP de la ville
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-accent-glow">
                  <Users className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Tables premium</h3>
                <p className="text-muted-foreground">
                  Réservez votre table VIP et profitez d'un service personnalisé
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Expérience unique</h3>
                <p className="text-muted-foreground">
                  Vivez des moments inoubliables dans une ambiance exceptionnelle
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 ClubManager. Tous droits réservés.</p>
            <p className="text-sm mt-2">Interface Client - Découvrez nos événements exclusifs</p>
          </div>
        </div>
      </footer>
    </div>
  );
}