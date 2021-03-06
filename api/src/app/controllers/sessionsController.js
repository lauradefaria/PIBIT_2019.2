const Session = require('../models/session');

module.exports = {

    async store (params) {
        try { 
            const session = await Session.create(params);
            
            return session;
        } catch (err) {
            if(err.name == 'ValidationError')
                throw { code: 10000, name: 'Informações incompletas'};
            throw { code: 10000, name:'Falha ao criar uma nova session'};
        }
    },
    async checkActivity(token) {
        const session = await Session.findOne({token});

        if(!session)
            throw { code: 10000, name:'Token inválido'};

        if(session.active === false)
            throw { code: 10000, name:'Token expirado'};

        return true;
    },
    async deactivate(userEmail) {
        

        try {
            const sessions = await Session.find({userEmail,active: true});

            if(!sessions)
                return true;

            sessions.forEach(async(session) => {
                session.active = false;
                await session.save();
            });

            return true;
        } catch (err) {
            throw { code: 10000, name:'Falha ao desativar sessions'};
        }
    }, 
    
    async index (req, res) {
        try {
            const sessions = await Session.find();
            if (sessions.length == 0) 
                return res.send('Não há sessions cadastrados');
            
            return res.json(sessions);
        } catch (err) {
            return res.status(500).send({ error: 'Falha ao listar todas as sessions' });
        }
    },
    async update (req, res) {
        try {
            const session = await Session.findByIdAndUpdate(req.params.id,req.body,{new:true});

            if(session == null){
                return res.status(404).send({ error: 'Session não encontrado' });
            }

            return res.json(session);
        } catch(err) {
            if(err.name == 'CastError')
                return res.status(404).send({ error: 'Session não encontrado'});

            return res.status(500).send({ error: 'Falha ao atualizar session' });
        }
    },
    async destroy (req, res) {
        try {
            const session = await Session.findByIdAndRemove(req.params.id);
            if(session == null){
                return res.status(404).send({ error: 'Session não encontrado' });
            }
            
            return res.send('Removido');
        } catch(err) {
            if(err.name == 'CastError')
                return res.status(404).send({ error: 'Session não encontrada'});
            return res.status(500).send({ error: 'Falha ao deletar session' });
        }
    },
    async logout(req, res) {
        const token = req.headers.authorization;

        try {
            const session = await Session.findOne({token});
            
            if(!session)
                return res.status(400).send({error: 'Token inválido'});

            if(session.active === false)
                return res.status(400).send({error: 'Session já sofreu logout'});

            session.active = false;
            await session.save();

            return res.send('Session expirada');
        } catch (err) {
            return res.status(500).send({ error: 'Falha ao sair' });
        }
    }
};