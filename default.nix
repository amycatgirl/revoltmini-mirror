
{ pkgs ? import (fetchTarball("https://github.com/NixOS/nixpkgs/archive/0b3d618173114c64ab666f557504d6982665d328.tar.gz")) {}}:

pkgs.mkShell {
  name = "revoltMini";

  shellHook = ''
    alias ll="ls -l --color";
    echo "You've entered the RevoltMini Developer Shell";
    echo "This shell comes with nodejs 20, pnpm, ts-server and other goodies";
    echo "Happy hacking!";
  '';
  
  packages = with pkgs; [
    nodejs
    nodejs.pkgs.pnpm
    nodejs.pkgs.typescript-language-server
    nodejs.pkgs.vscode-langservers-extracted
  ];
}
