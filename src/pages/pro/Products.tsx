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
  DialogDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  ArrowUpDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ProductCategory = "boisson" | "bouteille" | "snack" | "shisha";

interface Product {
  id: string;
  nom: string;
  prix: number;
  categorie: ProductCategory;
}

export default function Products() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"nom" | "prix" | "categorie">("categorie");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    nom: "",
    prix: "",
    categorie: "boisson" as ProductCategory
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

  const resetForm = () => {
    setNewProduct({
      nom: "",
      prix: "",
      categorie: "boisson"
    });
    setEditingProduct(null);
  };

  const createOrUpdateProduct = async () => {
    try {
      if (!newProduct.nom || !newProduct.prix) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const productData = {
        nom: newProduct.nom,
        prix: Number(newProduct.prix),
        categorie: newProduct.categorie
      };

      let error;
      if (editingProduct) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id));
      } else {
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      toast.success(editingProduct ? 'Produit modifié avec succès !' : 'Produit créé avec succès !');
      setIsDialogOpen(false);
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      toast.error('Erreur lors de la sauvegarde du produit');
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

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      nom: product.nom,
      prix: product.prix.toString(),
      categorie: product.categorie
    });
    setIsDialogOpen(true);
  };

  const getCategoryColor = (category: ProductCategory) => {
    switch (category) {
      case "boisson": return "bg-blue-500 text-white";
      case "bouteille": return "bg-purple-500 text-white";
      case "snack": return "bg-orange-500 text-white";
      case "shisha": return "bg-green-500 text-white";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case "boisson": return "🍹";
      case "bouteille": return "🍾";
      case "snack": return "🍿";
      case "shisha": return "💨";
      default: return "📦";
    }
  };

  const getCategoryLabel = (category: ProductCategory) => {
    switch (category) {
      case "boisson": return "Boissons";
      case "bouteille": return "Bouteilles";
      case "snack": return "Snacks";
      case "shisha": return "Shisha";
      default: return category;
    }
  };

  // Filtrage et tri des produits
  let filteredProducts = products.filter(product => {
    const matchesSearch = product.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.categorie === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Tri des produits
  filteredProducts = filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case "nom":
        return a.nom.localeCompare(b.nom);
      case "prix":
        return a.prix - b.prix;
      case "categorie":
        return a.categorie.localeCompare(b.categorie);
      default:
        return 0;
    }
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.categorie]) {
      acc[product.categorie] = [];
    }
    acc[product.categorie].push(product);
    return acc;
  }, {} as Record<ProductCategory, Product[]>);

  const categories: ProductCategory[] = ["boisson", "bouteille", "snack", "shisha"];
  const totalProducts = products.length;
  const filteredCount = filteredProducts.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des produits</h1>
          <p className="text-muted-foreground">
            Gérez votre carte et vos prix • {totalProducts} produit{totalProducts !== 1 ? 's' : ''} au total
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
              </DialogTitle>
              <DialogDescription>
                Renseignez le nom, la catégorie et le prix du produit.
              </DialogDescription>
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
                <label className="text-sm font-medium">Catégorie *</label>
                <Select 
                  value={newProduct.categorie} 
                  onValueChange={(value) => setNewProduct({...newProduct, categorie: value as ProductCategory})}
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
              
              <div>
                <label className="text-sm font-medium">Prix (€) *</label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="15.00" 
                  className="mt-1"
                  value={newProduct.prix}
                  onChange={(e) => setNewProduct({...newProduct, prix: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="bg-gradient-primary" onClick={createOrUpdateProduct}>
                  {editingProduct ? 'Sauvegarder' : 'Ajouter le produit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search, Filters and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="boisson">🍹 Boissons</SelectItem>
              <SelectItem value="bouteille">🍾 Bouteilles</SelectItem>
              <SelectItem value="snack">🍿 Snacks</SelectItem>
              <SelectItem value="shisha">💨 Shisha</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "nom" | "prix" | "categorie")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="categorie">Catégorie</SelectItem>
              <SelectItem value="nom">Nom</SelectItem>
              <SelectItem value="prix">Prix</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Stats */}
      {totalProducts > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category) => {
            const count = products.filter(p => p.categorie === category).length;
            return (
              <Card key={category} className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-1">{getCategoryIcon(category)}</div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{getCategoryLabel(category)}</div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-2xl font-bold text-primary">{totalProducts}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products by Category */}
      {Object.keys(groupedProducts).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getCategoryIcon(category as ProductCategory)}</span>
                <h2 className="text-xl font-bold text-foreground">
                  {getCategoryLabel(category as ProductCategory)}
                </h2>
                <Badge variant="outline">
                  {categoryProducts.length} produit{categoryProducts.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryProducts.map((product) => (
                  <Card key={product.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-foreground line-clamp-2">
                            {product.nom}
                          </CardTitle>
                        </div>
                        <Badge className={getCategoryColor(product.categorie)}>
                          {getCategoryIcon(product.categorie)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="text-2xl font-bold text-primary">
                          €{product.prix.toFixed(2)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 hover:bg-secondary"
                            onClick={() => startEdit(product)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Êtes-vous sûr de vouloir supprimer "{product.nom}" ? 
                                  Cette action est irréversible.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteProduct(product.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
            {products.length === 0 ? "Aucun produit créé" : 
             searchQuery || categoryFilter !== "all" ? "Aucun produit trouvé" : "Aucun produit"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {products.length === 0 ? "Commencez par ajouter vos premiers produits à votre carte" : 
             "Essayez de modifier vos critères de recherche"}
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