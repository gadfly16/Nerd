package api

import "github.com/gadfly16/nerd/internal/tree"

func Init(dbPath string) error {
	return tree.InitInstance(dbPath)
}

func Run(dbPath string) error {
	return tree.Run(dbPath)
}
