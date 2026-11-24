# Roteiro do pitch — ConFin (5 min)

> Gerado automaticamente por `gerar-slides.js`. As mesmas falas estão nas **anotações do apresentador** de cada slide (no PowerPoint: Apresentação de Slides → Modo de Exibição do Apresentador).
> A divisão "Apresentador 1–4" é uma sugestão. Troquem pelos nomes de quem vai falar cada parte.

| # | Slide | Tempo | Quem |
|---|---|---|---|
| 1 | Capa | 0:15 | Apresentador 1 |
| 2 | O problema | 0:30 | Apresentador 1 |
| 3 | A solução | 0:30 | Apresentador 1 |
| 4 | Demonstração (tempo real) | 1:00 | Apresentador 2 |
| 5 | Outras telas | 0:20 | Apresentador 2 |
| 6 | Arquitetura | 0:40 | Apresentador 3 |
| 7 | Tecnologias | 0:35 | Apresentador 3 |
| 8 | Hospedagem e deploy | 0:30 | Apresentador 4 |
| 9 | Processo e requisitos | 0:25 | Apresentador 4 |
| 10 | Encerramento | 0:15 | Apresentador 4 |

## 1. Capa (0:15, Apresentador 1)

Boa noite! Somos [nomes] e vamos apresentar o ConFin: um sistema de controle financeiro em que a família inteira registra os gastos e acompanha o orçamento do mês em tempo real.

## 2. O problema (0:30, Apresentador 1)

No levantamento de requisitos, aplicamos um questionário a 15 famílias e encontramos três dores: cada pessoa paga de um jeito, as contas fixas ficam concentradas em uma só pessoa, e ninguém sabe se o orçamento estourou até a fatura chegar. Uma das famílias resumiu bem: [ler a citação].

## 3. A solução (0:30, Apresentador 1)

O ConFin resolve isso: cada membro registra a despesa no celular na hora da compra, em dois toques, e o saldo atualiza na tela de todo mundo em tempo real. Quando o mês chega a 80% do limite, todos recebem um alerta. É um PWA: instala como aplicativo no Android, iPhone ou computador, sem precisar de loja.

## 4. Demonstração (tempo real) (1:00, Apresentador 2)

SE A INTERNET FUNCIONAR: faça a demo ao vivo com dois celulares (Ana e Carlos) e pule para o slide 6. SE NÃO: "Aqui é a família Souza. A Ana está no celular dela: o mês está em 72% do limite de R$ 4.500. O Carlos vai ao mercado e registra R$ 420,90: valor, categoria, meio de pagamento, e o app já mostra quanto vai sobrar. Ele toca em Salvar e, na mesma hora, sem recarregar nada, o celular da Ana mostra quem gastou, o saldo novo e o alerta amarelo de que a família passou de 80% do orçamento."

## 5. Outras telas (0:20, Apresentador 2)

Além disso, o dashboard mostra os gastos por categoria, a comparação dos últimos 6 meses com o limite e quanto a família ainda pode gastar por dia. Na tela Família, o administrador define o limite e convida pessoas por código ou e-mail. E o histórico tem filtros por mês, categoria e membro.

## 6. Arquitetura (0:40, Apresentador 3)

Por dentro, são três partes. O front-end, feito em React, roda no celular ou no navegador. Ele conversa por HTTPS com o nosso servidor em Node.js com Express, que expõe uma API REST e usa Socket.io para o tempo real: cada família é uma "sala". O servidor guarda os dados num banco PostgreSQL. O caminho de uma despesa: o app envia para a API, a API valida (o valor tem que ser positivo, RN002), grava no banco e avisa pelo Socket.io todos os membros daquela família, cuja tela atualiza na hora.

## 7. Tecnologias (0:35, Apresentador 3)

Escolhemos JavaScript nos dois lados: React no front-end e Node.js com Express no back-end. Assim a equipe usa uma só linguagem. O tempo real é feito com Socket.io, que mantém uma conexão aberta com o celular. O banco é o PostgreSQL, relacional, e algumas regras de negócio ficam garantidas no próprio banco, como o e-mail único e o valor positivo. As senhas são guardadas com hash bcrypt, nunca em texto, e o login usa token JWT.

## 8. Hospedagem e deploy (0:30, Apresentador 4)

O sistema está no ar. O servidor roda no Render e o banco no Supabase, os dois em plano gratuito, o que atende à restrição de orçamento do nosso TAP. Usamos o modelo PaaS (plataforma como serviço): diferente de uma máquina virtual na AWS, em que teríamos que instalar sistema, servidor e certificado, aqui entregamos só o código. E temos deploy contínuo: cada git push no GitHub gera uma nova versão sozinha, que só entra no ar depois de passar no teste de saúde.

## 9. Processo e requisitos (0:25, Apresentador 4)

Seguimos as etapas da Engenharia de Software: levantamos os requisitos com as famílias, prototipamos no papel e no Figma, modelamos com UML, BPMN e o banco relacional, desenvolvemos o MVP com um teste automatizado de ponta a ponta e fizemos o deploy. Todos os requisitos funcionais e regras de negócio da documentação foram implementados, e cada um está identificado no código pelo seu ID.

## 10. Encerramento (0:15, Apresentador 4)

O ConFin está no ar: quem quiser pode apontar a câmera para o QR code, criar uma conta e testar agora. Como próximos passos, queremos integrar com o Open Finance para importar os gastos direto do banco. Obrigado! Ficamos à disposição para perguntas.
