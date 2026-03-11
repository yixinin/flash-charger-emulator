//go:build wasm
// +build wasm

package main

import (
	"syscall/js"
)

func main() {
	// Initialize the store
	Init()

	// Register JavaScript functions
	js.Global().Set("chargerInit", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		Init()
		return nil
	}))

	js.Global().Set("chargerUpdate", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		result := Update()
		return js.ValueOf(result)
	}))

	js.Global().Set("chargerUpdateConfig", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if len(args) > 0 {
			configJSON := args[0].String()
			UpdateConfig(configJSON)
		}
		return nil
	}))

	js.Global().Set("chargerGetState", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		result := GetState()
		return js.ValueOf(result)
	}))

	// Keep the program running
	select {}
}
