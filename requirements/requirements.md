**Requisitos Funcionais (RF)**

**Módulo 1: Gestão de Posts e Conteúdo**
*   **RF001:** Permitir que o redator crie um novo "Post".
*   **RF002:** Cada Post deve ter um título/identificador único (sugestão: gerado automaticamente com data/sequencial, mas editável).
*   **RF003:** Associar uma data de publicação prevista ao Post.
*   **RF004:** Opção de definir um "Briefing Geral do Post" (objetivo, público-alvo, campanha associada, etc.) antes de criar os cards.
*   **RF005:** Permitir adicionar Tags/Categorias a um Post (gerenciadas por um Administrador).
*   **RF006:** Permitir criar "Releases" (ou Campanhas/Agrupamentos) com nome e um período opcional (data de início/fim).
*   **RF007:** Permitir associar um Post a um "Release".
*   **RF008:** Iniciar um novo Post com um card padrão.
*   **RF009:** Permitir adicionar múltiplos cards a um Post para criar um carrossel.
*   **RF010:** Permitir reordenar os cards dentro de um Post (arrastar e soltar seria ideal).
*   **RF011:** Permitir duplicar um card dentro do mesmo Post.
*   **RF012:** Permitir excluir um card.
*   **RF013:** Cada card deve conter um campo para "Texto Principal" (legenda do post).
    *   **RF013.1:** O campo "Texto Principal" deve ter um contador de caracteres (opcionalmente configurável).
*   **RF014:** Cada card deve conter um campo para "Texto da Arte" (texto que irá na imagem/vídeo).
    *   **RF014.1:** O campo "Texto da Arte" deve ter um contador de caracteres (opcionalmente configurável).
*   **RF015:** Cada card deve conter um campo para "Explicação para o Designer" (orientações, referências, etc. – o redator preenche para o designer externo).
*   **RF016:** Cada card deve ter a funcionalidade de upload de arquivo para "Arte Finalizada" (o redator faz o upload da arte fornecida pelo designer).
    *   **RF016.1:** O sistema deve suportar formatos comuns de imagem (JPG, PNG, GIF) e vídeo (MP4) para a arte.
    *   **RF016.2:** O sistema deve definir um limite máximo de tamanho para o upload da arte.
    *   **RF016.3:** O sistema deve exibir uma miniatura da arte após o upload no card.
    *   **RF016.4:** O sistema deve permitir remover/substituir a arte enviada em um card.
*   **RF017:** Todos os campos de texto (Texto Principal, Texto da Arte, Explicação para o Designer) e a arte do card (referência ao arquivo/miniatura) devem ter histórico de versões, indicando o usuário e a data/hora da alteração.
    *   **RF017.1:** Permitir visualizar versões anteriores do texto.
    *   **RF017.2:** (Pós-MVP) Permitir restaurar uma versão anterior do texto.
    *   **RF017.3:** Permitir visualizar/acessar referências a versões anteriores dos arquivos de arte que foram substituídos.
*   **RF018:** O Redator deve ter uma ação para marcar um Post com status "Aprovado" como "Publicado".
*   **RF019:** Usuários com permissão de edição devem poder marcar um Post como "Arquivado". Posts arquivados podem ser ocultados das listas padrão, mas acessíveis por filtros/busca.

**Módulo 2: Fluxo de Aprovação**
*   **RF020:** Os 3 aprovadores são fixos e identificados por seus papéis: CEO, COO, CMO.
*   **RF021:** Para cada Post, o sistema deve exibir o status de aprovação individual de cada um dos 3 aprovadores designados (Pendente, Aprovado, Rejeitado).
*   **RF022:** O redator deve poder "Submeter para Aprovação" um Post (muda status para "Em Aprovação").
*   **RF023:** Ao submeter para aprovação, o redator define uma "Data Limite para Aprovação".
    *   **RF023.1:** A data limite para aprovação deve ser posterior à data atual.
*   **RF024:** Aprovadores podem editar diretamente os campos de texto e substituir a arte nos cards (gerando nova versão conforme RF017 e acionando RF029).
*   **RF025:** Aprovadores devem ter opções para sua tarefa de aprovação do Post: "Aprovar Post", "Rejeitar Post".
*   **RF026:** Ao "Rejeitar Post", o aprovador DEVE adicionar um comentário geral explicando o motivo da rejeição.
*   **RF027:** Aprovadores podem ver o status de aprovação dos outros aprovadores para o mesmo post.
*   **RF028:** O Post deve ter um status geral: Rascunho, Em Aprovação, Ajustes Necessários, Aprovado, Publicado, Arquivado.
*   **RF029:** Se um post com status "Em Aprovação" ou "Ajustes Necessários" tiver qualquer conteúdo de seus cards (texto ou arte) editado por qualquer usuário, o status de aprovação individual de TODOS os aprovadores designados (CEO, COO, CMO) é resetado para "Pendente". O Post permanece no status geral em que estava.
*   **RF030:** Regra de Aprovação Automática (CMO Override):
    *   Se o CMO marcar sua aprovação individual para o Post como "Aprovado", E
    *   A "Data Limite para Aprovação" (RF023) for atingida, E
    *   Pelo menos um dos outros aprovadores (CEO ou COO) ainda estiver com status individual "Pendente" para aquele Post,
    *   ENTÃO o status geral do Post muda automaticamente para "Aprovado".
*   **RF031:** Regra de Aprovação Padrão:
    *   Se CEO, COO e CMO marcarem sua aprovação individual para o Post como "Aprovado",
    *   ENTÃO o status geral do Post muda para "Aprovado". A data de aprovação do post é a data/hora da última aprovação individual recebida.
*   **RF032:** Se um aprovador "Rejeitar Post":
    *   O status geral do Post muda para "Ajustes Necessários".
    *   O redator é notificado.
    *   As aprovações individuais já concedidas pelos outros aprovadores para aquela submissão específica são mantidas como referência histórica.
    *   Após o redator editar o post (acionando RF029), ele deve "Ressubmeter para Aprovação". Esta ação muda o status para "Em Aprovação" e notifica os aprovadores para uma nova rodada de revisão.

**Módulo 3: Notificações**
*   **RF033:** Notificar (in-app primário, e-mail opcional) os aprovadores relevantes quando um novo post for submetido/ressubmetido para sua aprovação.
*   **RF034:** Notificar (in-app, e-mail opcional) o redator quando um post for aprovado ou rejeitado por um aprovador (incluir o comentário de rejeição).
*   **RF035:** Notificar (in-app, e-mail opcional) o redator quando o status geral do post mudar para "Aprovado".
*   **RF036:** Enviar um lembrete (in-app, e-mail opcional) aos aprovadores se uma tarefa de aprovação estiver se aproximando da "Data Limite para Aprovação" e ainda estiver pendente (ex: 24h antes).
*   **RF037:** Notificações devem ser visíveis dentro do aplicativo (ex: ícone de sino com contador de não lidas).
*   **RF038:** Um painel de notificações centralizado deve listar todas as notificações recebidas pelo usuário, permitindo marcá-las como lidas.
*   **RF039:** Os usuários (especialmente aprovadores) devem poder configurar suas preferências de notificação, incluindo a opção de receber um resumo diário de tarefas pendentes por e-mail, em vez de notificações individuais por e-mail para cada novo post. Notificações in-app e lembretes de prazo devem permanecer ativos.

**Módulo 4: Usuários e Permissões (e Administração)**
*   **RF040:** O sistema deve permitir o cadastro de usuários (provisionados automaticamente após primeira autenticação via Google com domínio permitido).
*   **RF041:** O sistema deve ter papéis base: Redator, Aprovador (para acesso às funcionalidades de aprovação).
*   **RF042:** Um Administrador deve poder designar usuários específicos para os papéis funcionais de aprovação "CEO", "COO" e "CMO". Um mesmo usuário pode ter o papel de Redator e ser um dos aprovadores designados.
*   **RF043:** O primeiro usuário autenticado com o domínio configurado ou um usuário específico pode ser designado como Administrador inicial.
*   **RF044:** Funcionalidades de Administração:
    *   **RF044.1:** Listar e visualizar usuários do sistema.
    *   **RF044.2:** Atribuir/remover usuários dos papéis funcionais (CEO, COO, CMO).
    *   **RF044.3:** Configurar o domínio de e-mail permitido para autenticação (conforme RNF002).
    *   **RF044.4:** Gerenciar (criar, editar, excluir) Tags/Categorias globais para posts.
    *   **RF044.5:** Gerenciar (criar, editar, excluir) Releases.

**Módulo 5: Visualização, Interação e Dashboards**
*   **RF045:** Dashboard inicial para redatores com resumo dos seus posts (ex: X em Rascunho, Y em Aprovação, Z Aprovados), próximos prazos de publicação, e posts recentes com ajustes necessários.
*   **RF046:** Dashboard inicial para aprovadores com resumo de suas tarefas pendentes, prazos se aproximando, e posts recentemente aprovados/rejeitados por ele.
*   **RF047:** Tela "Minhas Tarefas de Aprovação" para cada aprovador.
*   **RF048:** Listar os posts pendentes de sua aprovação na tela de tarefas, exibindo: Título do Post, Redator, Data de Submissão, Data Limite para Aprovação.
*   **RF049:** Permitir ordenar e filtrar as tarefas de aprovação (ex: por data limite, por redator, por Release).
*   **RF050:** Ao abrir uma tarefa de aprovação, o aprovador visualiza todos os cards do post com seus conteúdos.
*   **RF051:** Busca global por posts (por título, conteúdo de texto dos cards, status, redator, tags, release, data de publicação, data limite de aprovação).
*   **RF052:** Visualização em formato de Calendário, exibindo os posts pela "Data de Publicação Prevista" e indicando seu status geral (ex: através de cores). Permitir clicar no post no calendário para abri-lo.
*   **RF053:** Permitir filtrar a lista principal de posts por: Status geral, Redator, Data de Publicação (intervalo), Data Limite de Aprovação (intervalo), Tags/Categorias, Release.
*   **RF054:** Log de Auditoria do Post: Um log detalhado e imutável para cada post, registrando: Evento (ex: Criação, Edição de Campo X, Submissão, Aprovação, etc.), Usuário responsável, Data/Hora, Detalhes (ex: valor antigo e novo para edições de texto, comentário de rejeição, regra de aprovação acionada).

**Requisitos Não Funcionais (RNF)**

*   **RNF001 (Segurança - Autenticação):** O sistema deve utilizar autenticação via Google OAuth.
*   **RNF002 (Segurança - Restrição de Domínio):** O acesso ao sistema deve ser restrito a usuários autenticados com contas Google pertencentes a um domínio de e-mail específico (ex: `nome-do-usuario@dominio.com.br`). A configuração deste domínio deve ser gerenciável por um administrador do sistema.
*   **RNF003 (Manutenibilidade):** O código-fonte do aplicativo deve ser bem organizado, seguindo boas práticas de desenvolvimento, com clareza na estrutura de módulos/componentes e comentários adequados para facilitar a compreensão e futuras manutenções/atualizações.
*   **RNF004 (Usabilidade):** A interface do usuário deve ser intuitiva e fácil de usar, minimizando a curva de aprendizado para novos usuários.
*   **RNF005 (Responsividade):** O aplicativo deve ser responsivo, funcionando adequadamente em navegadores de desktop. A adaptação para tablets é desejável.
*   **RNF006 (Disponibilidade):** O sistema deve ter um bom nível de disponibilidade, minimizando o tempo de inatividade não planejado (sem necessidade de alta disponibilidade extrema para MVP).
*   **RNF007 (Consistência de Dados):** O sistema deve garantir a integridade e consistência dos dados, especialmente no que tange ao histórico de versões, status de aprovação e logs de auditoria.
*   **RNF008 (Performance):** (Menor prioridade inicial, mas desejável) O sistema deve carregar posts e listas de forma razoavelmente rápida para uma boa experiência do usuário.
*   **RNF009 (Escalabilidade):** (Menor prioridade inicial) A arquitetura deve permitir crescimento futuro sem grandes reestruturações, embora a otimização para alta escalabilidade não seja foco do MVP.
