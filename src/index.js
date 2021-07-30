const { response } = require('express')
const express = require('express')
const { v4: uuid } = require('uuid') //v4 - gera o uuid com numeros random

const app = express()

app.use(express.json()) //pra conseguir receber json

//dados em memoria. toda vida que o nodemon recarrega, ele zera
const customers = []

/**
 * cpf: string
 * name: string
 * id: uuid - gerado na aplicação
 * statement (extrato/lançamentos da conta): array - embora seja algo da conta, não necessariamente vai receber nas infos da conta esse statement
 */
app.post('/account', (req, res) => {
  // inserção de dados - tipo de parametro a receber é o request body
  const { cpf, name } = req.body
  //some retorna verdadeiro ou falso e dentro dele vai o que se quer verificar
  // === pra verificar os valores e o tipo
  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if(customerAlreadyExists){
    return res.status(400).json({ error: "Customer already exists "})
  }

  //aplicação sem banco de dados. Criar um array pra salvar os clientes
  customers.push({ //inserir dados no array
    cpf,
    name,
    id: uuid(),
    statement: []
  })
  return res.status(201).send()
})
// :var - route params
app.get('/statement/:cpf', (req, res) => {
  const { cpf } = req.params

  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return response.status(400).json({ error: "Customer not found" })
  }

  return res.json(customer.statement)
})

app.listen(3000)