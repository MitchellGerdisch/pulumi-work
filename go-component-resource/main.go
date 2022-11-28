package main

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		randoStuff, err := NewRandomStuff(ctx, "randoStuff", &RandomStuffArgs{
			NumParts: pulumi.Int(2),
		})
		if err != nil {
			return err
		}

		ctx.Export("alphaPetName", randoStuff.PetNames.PetNameAlpha)
		ctx.Export("alphaNumber", randoStuff.Numbers[0].RandomNumberAlpha)
		ctx.Export("betaPetName", randoStuff.PetNames.PetNameBeta)
		ctx.Export("betaNumber", randoStuff.Numbers[0].RandomNumberBeta)

		return nil
	})
}
