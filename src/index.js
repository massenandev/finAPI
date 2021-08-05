const { response, request, json } = require('express')
const express = require('express')
const { v4: uuid } = require('uuid') //v4 - gera o uuid com numeros random

const app = express()

app.use(express.json()) //pra conseguir receber json

//dados em memoria. toda vida que o nodemon recarrega, ele zera
const customers = []

//middleware

//next define se o middleware prossegue com a operação ou se ele para por aí
function verifyIfAccountExistsCPF(request, response, next){
  const { cpf } = request.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer){
    return response.status(400).json({ error: "Customer not found" })
  }

  //fazendo assim, todas as rotas que se utilizarem do middleware têm acesso ao customer
  request.customer = customer

  return next() 
}

function getBalance(statement){
  //reduce pega as infos de determinado valor que passa pra ela e ela  transforma as infos e valores em um valor somente
  //Fazer o calculo do que entrou menos o que saiu
  //acc é acumulador e o operation é o obj que se quer iterar
  //o acc armazena o valor que quer adicionar ou retirar de dentro do obj
  const balance = statement.reduce((acc, operation) => {
    //temos somente duas operações: debito (-) ou credito(-)
    if(operation.type == 'credit'){
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
    //iniciando o valor em 0
  }, 0)

  return balance
}

/**
 * cpf: string
 * name: string
 * id: uuid - gerado na aplicação
 * statement (extrato/lançamentos da conta): array - embora seja algo da conta, não necessariamente vai receber nas infos da conta esse statement
 */
app.post('/account', (request, response) => {
  // inserção de dados - tipo de parametro a receber é o request body
  const { cpf, name } = request.body
  //some retorna verdadeiro ou falso e dentro dele vai o que se quer verificar
  // === pra verificar os valores e o tipo
  const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)

  if(customerAlreadyExists){
    return response.status(400).json({ error: "Customer already exists "})
  }

  //aplicação sem banco de dados. Criar um array pra salvar os clientes
  customers.push({ //inserir dados no array
    cpf,
    name,
    id: uuid(),
    statement: []
  })
  return response.status(201).send()
})

//app.use(verifyIfAccountExistsCPF) - todas as rotas se utilizam do middleware

// :var - route params
// statement geral
app.get('/statement', verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request
  return response.json(customer.statement)
})

app.post('/deposit', verifyIfAccountExistsCPF, (request, response) => {
  const { description, amount } = request.body

  //passando as informações pra dentro do statement do user
  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  // como se está trabalhando com dados em memória, ele ja vai pegar a posição do customer e inserir o statement corretamente
  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.post('/withdraw', verifyIfAccountExistsCPF, (request, response) => {
  const { amount } = request.body
  //pra pegar as infos de quanto ele tem em conta
  const { customer } = request

  //ver o balanço da conta
  const balance = getBalance(customer.statement)

  if(balance < amount){
    return response.status(400).json({ error: 'Insufficient funds' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

//statement a partir de uma certa data
app.get('/statement/date', verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query

  //pra conseguir fazer a busca pelo dia independente da hora em que fez a transação
  const dateFormat = new Date(date + " 00:00")

  // filtro pra retornar somente o extrato do dia 
  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

  return response.json(statement)
})

app.put('/account', verifyIfAccountExistsCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request

  customer.name = name

  return response.status(201).send()
})

app.get('/account', verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request

  return response.json(customer)
})

app.delete('/account', verifyIfAccountExistsCPF, (request, response) => {
  const { customer } = request
  //splice remove - ela espera um array. o primeiro param é onde inicia o splice, que é no próprio customer, que é o obj que se quer excluir
  // o segundo parametro é até onde ele espera que seja feita a remoção
  //como so quero que seja removido uma posição a partir do customer, passa o valor de 1 porque ele vai remover exatamente esse customer
  customers.splice(customer, 1)

  return response.status(200).json(customers)
})

app.listen(3000)