package main 

import (
	"github.com/pulumi/pulumi-random/sdk/v4/go/random"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"fmt"
	// "time"
)

// The set of arguments for creating a RandomName component resource.
type RandomStuffArgs struct {
	// The HTML content for index.html.
	NumParts pulumi.IntInput `pulumi:"numParts"`
}

type NestedStructPetNames struct {
	PetNameAlpha pulumi.StringOutput `pulumi:"petNameAlpha"`
	PetNameBeta pulumi.StringOutput `pulumi:"petNameBeta"`
}

type NestedStructRandomNumbers struct {
	RandomNumberAlpha pulumi.IntOutput `pulumi:"randomNumberAlpha"`
	RandomNumberBeta pulumi.IntOutput `pulumi:"randomNumberBeta"`
}

// The RandomName component resource.
type RandomStuff struct {
	pulumi.ResourceState

	PetNames NestedStructPetNames `pulumi:"petNames"`
	Numbers [5]NestedStructRandomNumbers `pulumi:"numbers"`
}

// NewRandomStuff creates RandomStuff component resources.
func NewRandomStuff(ctx *pulumi.Context,
	name string, args *RandomStuffArgs, opts ...pulumi.ResourceOption) (*RandomStuff, error) {
	if args == nil {
		args = &RandomStuffArgs{}
	}

	component := &RandomStuff{}
	err := ctx.RegisterComponentResource("pet:index:RandomStuff", name, component, opts...)
	if err != nil {
		return nil, err
	}

	// Use size of pet name that was passed in as an argument to generate a random number
	randomMax := args.NumParts.ToIntOutput().ApplyT(func(numparts int) int {
		return numparts*2
	}).(pulumi.IntInput)

	// Create a random pet name
	alphaPet, err := random.NewRandomPet(ctx, fmt.Sprintf("%s-alphapet", name), &random.RandomPetArgs{
		Length: pulumi.IntPtrInput(args.NumParts),
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Create a random number for no real good reason other than testing stuff out
	alphaNumber, err := random.NewRandomInteger(ctx, fmt.Sprintf("%s-alphanumber", name), &random.RandomIntegerArgs{
		Max: randomMax,
		Min: args.NumParts,
	}, pulumi.Parent(component))
	if err != nil {
		return nil, err
	}

	// Create another random pet name
	betaPet, err := random.NewRandomPet(ctx, fmt.Sprintf("%s-betapet", name), &random.RandomPetArgs{
	Length: pulumi.IntPtrInput(args.NumParts),
	}, pulumi.Parent(component))
	if err != nil {
	return nil, err
	}

	// Create another random number for no real good reason other than testing stuff out
	betaNumber, err := random.NewRandomInteger(ctx, fmt.Sprintf("%s-betanumber", name), &random.RandomIntegerArgs{
	Max: randomMax,
	Min: args.NumParts,
	}, pulumi.Parent(component))
	if err != nil {
	return nil, err
	}

	var stuff RandomStuff

	stuff.PetNames.PetNameAlpha = pulumi.StringOutput(pulumi.IDOutput(alphaPet.ID()))
	stuff.PetNames.PetNameBeta = pulumi.StringOutput(pulumi.IDOutput(betaPet.ID()))
	stuff.Numbers[0].RandomNumberAlpha = alphaNumber.Result
	stuff.Numbers[0].RandomNumberBeta = betaNumber.Result

	component=&stuff

	if err := ctx.RegisterResourceOutputs(component, pulumi.Map{
	}); err != nil {
		return nil, err
	}

	return component, nil
}
