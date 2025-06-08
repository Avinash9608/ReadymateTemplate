
"use client";

import { useSettings, type PageConfig } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, PlusCircle, Files, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
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
import { useState } from 'react';

export default function ManagePagesPage() {
  const { getAllPages, deletePage, isLoading, updatePage } = useSettings();
  const { toast } = useToast();
  const [pageToDelete, setPageToDelete] = useState<PageConfig | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const pages = getAllPages().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDeleteConfirmation = (page: PageConfig) => {
    setPageToDelete(page);
    setIsAlertOpen(true);
  };

  const executeDeletePage = () => {
    if (pageToDelete) {
      deletePage(pageToDelete.id);
      toast({
        title: "Page Deleted",
        description: `The page "${pageToDelete.title}" has been deleted.`,
      });
      setPageToDelete(null);
    }
    setIsAlertOpen(false);
  };

  const togglePublishStatus = (page: PageConfig) => {
    updatePage(page.id, { isPublished: !page.isPublished });
    toast({
      title: "Page Updated",
      description: `"${page.title}" is now ${!page.isPublished ? "published" : "unpublished"}.`,
    });
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading pages...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <Files className="h-10 w-10 text-primary" />
              <div>
                <CardTitle className="text-2xl font-headline">Manage Pages</CardTitle>
                <CardDescription>View, edit, or delete your custom pages.</CardDescription>
              </div>
            </div>
            <Link href="/admin/pages/create" passHref>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Page
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {pages.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="text-muted-foreground">/pages/{page.slug}</TableCell>
                      <TableCell>
                        <Badge variant={page.isPublished ? 'default' : 'outline'}>
                          {page.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(page.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => togglePublishStatus(page)} title={page.isPublished ? "Unpublish" : "Publish"}>
                          {page.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Link href={`/admin/pages/edit/${page.id}`} passHref>
                          <Button variant="outline" size="icon" title="Edit Page">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteConfirmation(page)} title="Delete Page">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-10">
                No custom pages created yet. Start by creating one!
              </p>
            )}
          </CardContent>
        </Card>

        {pageToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this page?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the page titled "<strong>{pageToDelete.title}</strong>"
                and remove it from your website. Any navbar links pointing to this page might also be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDeletePage}>Delete Page</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
