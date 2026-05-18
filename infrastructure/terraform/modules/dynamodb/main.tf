resource "aws_dynamodb_table" "main" {
  billing_mode   = var.billing_mode
  hash_key       = "pk"
  name           = "${var.project_name}-${var.environment}"
  range_key      = "sk"
  read_capacity  = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity = var.billing_mode == "PROVISIONED" ? var.write_capacity : null

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  global_secondary_index {
    hash_key        = "gsi1pk"
    name            = "gsi1"
    projection_type = "ALL"
    range_key       = "gsi1sk"
    read_capacity   = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
    write_capacity  = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = var.pitr_enabled
  }

  tags = {
    environment = var.environment
    managed_by  = var.managed_by
    owner       = var.owner
    project     = var.project_name
  }
}