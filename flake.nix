{
  description = "work";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { flake-utils, self, nixpkgs, ... }: 
  let
    system = flake-utils.lib.system.x86_64-linux;
    pkgs = nixpkgs.legacyPackages.${system};
    bun = pkgs.mkDerivation {
      name = "bun";
      version = "0.0.1";
      src = pkgs.fetchFromGitHub {
        owner = "zao";
        repo = "ooz";
        rev = "d52d2e2b67034baf68435c4673864e7f5e5b0f22";
        sha256 = pkgs.lib.fakeSha256;
      };
    };
  in
  {
    devShells.${system}.default = pkgs.mkShell {
      name = "work";
      nativeBuildInputs = [ 
        pkgs.yarn
      ];
    };
  };
}
