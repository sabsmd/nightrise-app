import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Products() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nom: "",
    prix: "",
    categorie: "boisson" as "boisson" | "bouteille" | "snack" | "shisha"
  });

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('categorie', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async () => {
    try {
      if (!newProduct.nom || !newProduct.prix) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          prix: Number(newProduct.prix)
        }]);

      if (error) throw error;

      toast.success('Produit créé avec succès !');
      setIsDialogOpen(false);
      setNewProduct({
        nom: "",
        prix: "",
        categorie: "boisson" as "boisson"
      });
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      toast.error('Erreur lors de la création du produit');
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Produit supprimé avec succès !');
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast.error('Erreur lors de la suppression du produit');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "boisson": return "bg-blue-500 text-white";
      case "bouteille": return "bg-purple-500 text-white";
      case "snack": return "bg-orange-500 text-white";
      case "shisha": return "bg-green-500 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "boisson": return "🍹";
      case "bouteille": return "🍾";
      case "snack": return "🍿";
      case "shisha": return "💨";
      default: return "📦";
    }
  };

  const filteredProducts = products.filter(product =>
    product.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categorie.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.categorie]) {
      acc[product.categorie] = [];
    }
    acc[product.categorie].push(product);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des produits</h1>
          <p className="text-muted-foreground">Gérez votre carte et vos prix</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Nom du produit *</label>
                <Input 
                  placeholder="Ex: Mojito, Dom Pérignon, Chips..." 
                  className="mt-1"
                  value={newProduct.nom}
                  onChange={(e) => setNewProduct({...newProduct, nom: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prix (€) *</label>
                <Input 
                  type="number" 
                  placeholder="15.00" 
                  className="mt-1"
                  value={newProduct.prix}
                  onChange={(e) => setNewProduct({...newProduct, prix: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Catégorie *</label>
                <Select 
                  value={newProduct.categorie} 
                  onValueChange={(value) => setNewProduct({...newProduct, categorie: value as any})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boisson">🍹 Boissons</SelectItem>
                    <SelectItem value="bouteille">🍾 Bouteilles</SelectItem>
                    <SelectItem value="snack">🍿 Snacks</SelectItem>
                    <SelectItem value="shisha">💨 Shisha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="bg-gradient-primary" onClick={createProduct}>
                  Ajouter le produit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Products by Category */}
      {Object.keys(groupedProducts).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getCategoryIcon(category)}</span>
                <h2 className="text-xl font-bold text-foreground capitalize">
                  {category === "boisson" ? "Boissons" :
                   category === "bouteille" ? "Bouteilles" :
                   category === "snack" ? "Snacks" :
                   category === "shisha" ? "Shisha" : category}
                </h2>
                <Badge variant="outline">
                  {(categoryProducts as any[]).length} produit{(categoryProducts as any[]).length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(categoryProducts as any[]).map((product) => (
                  <Card key={product.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
                          {product.nom}
                        </CardTitle>
                        <Badge className={getCategoryColor(product.categorie)}>
                          {getCategoryIcon(product.categorie)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="text-2xl font-bold text-primary">
                          €{Number(product.prix).toFixed(2)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1 hover:bg-secondary">
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {products.length === 0 ? "Aucun produit créé" : "Aucun produit trouvé"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {products.length === 0 ? "Commencez par ajouter vos premiers produits" : "Essayez avec d'autres termes de recherche"}
          </p>
          {products.length === 0 && (
            <Button className="bg-gradient-primary" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          )}
        </div>
      )}
    </div>
  );
}