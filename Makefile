
bin: src/main.ts
	@mkdir -p dist
	deno compile --allow-read --output ./dist/runner ./src/main.ts


.PHONY: clean
clean: 
	@rm -rf dist
