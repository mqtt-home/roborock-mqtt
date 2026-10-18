package web

import (
	"net/http"
	"strings"
)

// spaHandler serves the built web UI. Hashed files under /assets/ are cached
// forever; everything else (index.html included) must be revalidated, so a
// new release is picked up on the next load. A missing /assets/ file is a 404
// rather than the index.html fallback: an HTML answer to a stylesheet request
// makes the browser drop the CSS and render the page unstyled.
func spaHandler(distDir string, fileServer http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if f, err := http.Dir(distDir).Open(r.URL.Path); err == nil {
			st, _ := f.Stat()
			f.Close()
			if st != nil && !st.IsDir() {
				if strings.HasPrefix(r.URL.Path, "/assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				} else {
					w.Header().Set("Cache-Control", "no-cache")
				}
				fileServer.ServeHTTP(w, r)
				return
			}
		}
		if strings.HasPrefix(r.URL.Path, "/assets/") {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-cache")
		http.ServeFile(w, r, distDir+"index.html")
	}
}
