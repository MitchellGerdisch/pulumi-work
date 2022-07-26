resource "aws_internet_gateway" "igw" {
    vpc_id = "${aws_vpc.vpc.id}"
    tags = {
        Name = "mitch-prod-igw-tf"
    }
}

resource "aws_route_table" "public-rt" {
    vpc_id = "${aws_vpc.vpc.id}"
    
    route {
        //associated subnet can reach everywhere
        cidr_block = "0.0.0.0/0" 
        //CRT uses this IGW to reach internet
        gateway_id = "${aws_internet_gateway.igw.id}" 
    }
    
    tags = {
        Name = "mitch-public-crt-tf"
    }
}

resource "aws_route_table_association" "rta-public-subnet"{
    count = "${length(var.subnet_cidrs_public)}"
    subnet_id = "${element(aws_subnet.public-subnets.*.id, count.index)}"
    route_table_id = "${aws_route_table.public-rt.id}"
}

resource "aws_security_group" "ssh-http-allowed" {
    vpc_id = "${aws_vpc.vpc.id}"
    
    egress {
        from_port = 0
        to_port = 0
        protocol = -1
        cidr_blocks = ["0.0.0.0/0"]
    }
    ingress {
        from_port = 22
        to_port = 22
        protocol = "tcp"
        // This means, all ip address are allowed to ssh ! 
        // Do not do it in the production. 
        // Put your office or home address in it!
        cidr_blocks = ["0.0.0.0/0"]
    }
    ingress {
        from_port = 80
        to_port = 80
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }
    ingress {
        from_port = 443 
        to_port = 443 
        protocol = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }
    tags = {
        Name = "mitch-ssh-http-allowed-tf"
    }
}
