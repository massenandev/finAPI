const { response, request } = require('express')
const express = require('express')
const { v4: uuid } = require('uuid') //v4 - gera o uuid com numeros random

const app = express()

app.use(express.json()) //pra conseguir receber json

//dados em memoria. toda vida que o nodemon recarrega, ele zera
const customers = []

//middleware

//next define se o middleware prossegue com a operação ou se ele para por aí
function verifyIfAccountExistsCPF(req, res, next){
  const { cpf } = req.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return res.status(400).json({ error: "Customer not found" })
  }

  //fazendo assim, todas as rotas que se utilizarem do middleware têm acesso ao customer
  request.customer = customer

  return next() 
}

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

//app.use(verifyIfAccountExistsCPF) - todas as rotas se utilizam do middleware

// :var - route params
app.get('/statement', verifyIfAccountExistsCPF, (req, res) => {
  const { customer } = request
  return res.json(customer.statement)
})

app.post('/deposit', verifyIfAccountExistsCPF, (req, res) => {
  const { description, amount } = req.body

  //passando as informações pra dentro do statement do user
  const { customer } = req

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  // como se está trabalhando com dados em memória, ele ja vai pegar a posição do customer e inserir o statement corretamente
  customer.statement.push(statementOperation)

  return res.status(201).send()
})

app.listen(3000)