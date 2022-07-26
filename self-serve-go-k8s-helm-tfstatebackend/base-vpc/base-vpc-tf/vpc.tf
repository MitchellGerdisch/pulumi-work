resource "aws_vpc" "vpc" {
    cidr_block = "${var.vpc_cidr}"
    enable_dns_support = "true" #gives you an internal domain name
    enable_dns_hostnames = "true" #gives you an internal host name
    enable_classiclink = "false"
    instance_tenancy = "default"    
    tags = {
        Name = "mitch-vpc-tf"
    }
}

resource "aws_subnet" "public-subnets" {
    count = "${length(var.subnet_cidrs_public)}"
    cidr_block = "${var.subnet_cidrs_public[count.index]}"
    availability_zone = "${var.availability_zones[count.index]}"
    vpc_id = "${aws_vpc.vpc.id}"
    map_public_ip_on_launch = "true" //it makes this a public subnet
    tags = {
        Name = "mitch-pub-subnet-tf"
    }
}

output "vpc_id" {
    value = aws_vpc.vpc.id
}

output "public_subnet_ids" {
    value = aws_subnet.public-subnets[*].id
    # value = aws_subnet.mitch-public-subnet-tf.count.index
}