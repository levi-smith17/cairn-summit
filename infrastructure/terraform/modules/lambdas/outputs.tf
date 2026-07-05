output "lambdas" {
  value = {
    for k, v in module.lambda : k => {
      invoke_arn    = v.invoke_arn
      function_name = v.function_name
    }
  }
}

output "lambda_functions" {
  value = {
    for k, v in local.lambdas : k => {
      invoke_arn    = module.lambda[k].invoke_arn
      function_name = module.lambda[k].function_name
      route_key     = v.route_key
    }
  }
}

output "authorizer_invoke_arn" {
  value = module.auth_authorizer.invoke_arn
}

output "authorizer_function_name" {
  value = module.auth_authorizer.function_name
}