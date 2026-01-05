" Enhanced MCP Server - Neovim Configuration
" Place this in your init.vim or source it from there

" Project-specific settings
set tabstop=2
set shiftwidth=2
set expandtab
set autoindent
set smartindent

" Enable syntax highlighting
syntax enable
filetype plugin indent on

" JavaScript/Node.js specific settings
augroup javascript
    autocmd!
    autocmd FileType javascript setlocal tabstop=2 shiftwidth=2 expandtab
    autocmd FileType json setlocal tabstop=2 shiftwidth=2 expandtab
    autocmd FileType html setlocal tabstop=2 shiftwidth=2 expandtab
    autocmd FileType css setlocal tabstop=2 shiftwidth=2 expandtab
augroup END

" MCP file type detection
augroup mcp
    autocmd!
    autocmd BufRead,BufNewFile *.mcp set filetype=json
augroup END

" Key mappings for MCP development
nnoremap <leader>ms :!npm start<CR>
nnoremap <leader>md :!npm run dev<CR>
nnoremap <leader>mi :!npm install<CR>
nnoremap <leader>mo :!start http://localhost:3001<CR>

" Quick commands for development
command! McpStart !npm start
command! McpDev !npm run dev
command! McpInstall !npm install
command! McpOpen !start http://localhost:3001

" Debugging shortcuts
nnoremap <leader>db :!node --inspect-brk server.js<CR>
nnoremap <leader>di :!node --inspect server.js<CR>

" Git shortcuts
nnoremap <leader>gs :!git status<CR>
nnoremap <leader>ga :!git add .<CR>
nnoremap <leader>gc :!git commit -m ""<Left>
nnoremap <leader>gp :!git push<CR>

" File navigation
nnoremap <leader>fs :e server.js<CR>
nnoremap <leader>fp :e package.json<CR>
nnoremap <leader>fd :e dashboard.html<CR>
nnoremap <leader>fr :e README.md<CR>

" Terminal shortcuts
nnoremap <leader>t :terminal<CR>
nnoremap <leader>tv :vnew \| terminal<CR>
nnoremap <leader>th :new \| terminal<CR>

" Search and replace shortcuts
nnoremap <leader>sr :%s//g<Left><Left>
vnoremap <leader>sr :s//g<Left><Left>

" Quick save and quit
nnoremap <leader>w :w<CR>
nnoremap <leader>wq :wq<CR>
nnoremap <leader>q :q<CR>

" Show invisible characters
set list
set listchars=tab:›\ ,trail:•,extends:❯,precedes:❮,nbsp:×

" Search settings
set ignorecase
set smartcase
set hlsearch
set incsearch

" Line numbers
set number
set relativenumber

" Highlight current line
set cursorline

" Enable mouse
set mouse=a

" Clipboard integration
set clipboard+=unnamedplus

" Backup and swap files
set nobackup
set nowritebackup
set noswapfile

" Auto-completion
set wildmenu
set wildmode=longest,list,full

" Status line
set laststatus=2
set statusline=%f\ %h%w%m%r\ %=%(%l,%c%V\ %=\ %P%)