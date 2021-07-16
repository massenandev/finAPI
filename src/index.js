const express = require('express')
const { v4: uuid } = require('uuid') //v4 - gera o uuid com numeros random

const app = express()

app.use(express.json()) //pra conseguir receber json

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
  const id = uuid()
  //aplicação sem banco de dados. Criar um array pra salvar os clientes
  customers.push({ //inserir dados no array
    cpf,
    name,
    id,
    statement: []
  })
  return res.status(201).send()
})

app.listen(3000)