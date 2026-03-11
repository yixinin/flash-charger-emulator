package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

var (
	listenAddr = ":8080"
	distDir    = "dist"
)

func main() {
	if addr := os.Getenv("LISTEN_ADDR"); addr != "" {
		listenAddr = addr
	}

	if dir := os.Getenv("DIST_DIR"); dir != "" {
		distDir = dir
	}

	distFS, err := fs.Sub(http.Dir(distDir), ".")
	if err != nil {
		fmt.Printf("Error creating filesystem: %v\n", err)
		os.Exit(1)
	}

	handler := spaHandler{staticFS: distFS}

	fmt.Printf("Starting server at http://localhost%s\n", listenAddr)
	fmt.Printf("Serving files from: %s\n", distDir)

	if err := http.ListenAndServe(listenAddr, handler); err != nil {
		fmt.Printf("Server error: %v\n", err)
		os.Exit(1)
	}
}

type spaHandler struct {
	staticFS http.FileSystem
}

func (h spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	file, err := h.staticFS.Open(path)
	if err != nil {
		h.serveIndexHTML(w, r)
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		h.serveIndexHTML(w, r)
		return
	}

	if stat.IsDir() {
		indexPath := strings.TrimSuffix(path, "/") + "/index.html"
		indexFile, err := h.staticFS.Open(indexPath)
		if err != nil {
			h.serveIndexHTML(w, r)
			return
		}
		defer indexFile.Close()

		http.ServeContent(w, r, "index.html", stat.ModTime(), indexFile)
		return
	}

	ext := filepath.Ext(path)
	if ext == "" {
		h.serveIndexHTML(w, r)
		return
	}

	http.ServeContent(w, r, path, stat.ModTime(), file)
}

func (h spaHandler) serveIndexHTML(w http.ResponseWriter, r *http.Request) {
	indexFile, err := h.staticFS.Open("/index.html")
	if err != nil {
		http.Error(w, "index.html not found", http.StatusNotFound)
		return
	}
	defer indexFile.Close()

	stat, err := indexFile.Stat()
	if err != nil {
		http.Error(w, "Error reading index.html", http.StatusInternalServerError)
		return
	}

	http.ServeContent(w, r, "index.html", stat.ModTime(), indexFile)
}
