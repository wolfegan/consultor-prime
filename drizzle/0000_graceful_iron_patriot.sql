CREATE TABLE `apuracoes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`periodo_id` bigint unsigned NOT NULL,
	`consultor_id` bigint unsigned NOT NULL,
	`comissao_total` decimal(12,2) NOT NULL,
	`bonificacao` decimal(12,2) NOT NULL,
	`valor_nf` decimal(12,2) NOT NULL,
	`debitos` decimal(12,2) NOT NULL,
	`valor_liquido` decimal(12,2) NOT NULL,
	`producao_total` int NOT NULL,
	`detalhe` text NOT NULL,
	CONSTRAINT `apuracoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `apuracao_unica` UNIQUE(`periodo_id`,`consultor_id`)
);
--> statement-breakpoint
CREATE TABLE `consultor_nomes_sga` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`consultor_id` bigint unsigned NOT NULL,
	`nome` varchar(160) NOT NULL,
	`nome_normalizado` varchar(160) NOT NULL,
	CONSTRAINT `consultor_nomes_sga_id` PRIMARY KEY(`id`),
	CONSTRAINT `nome_sga_unico` UNIQUE(`nome_normalizado`)
);
--> statement-breakpoint
CREATE TABLE `consultores` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`nome` varchar(160) NOT NULL,
	`cpf_cnpj` varchar(20),
	`email` varchar(160),
	`telefone` varchar(30),
	`pix` varchar(160),
	`tipo_veiculo` enum('MOTO','CARRO','S/V'),
	`vinculo` enum('PJ','CLT','ADM'),
	`ativo` boolean NOT NULL DEFAULT true,
	`observacao` text,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `consultores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `despesas` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`periodo_id` bigint unsigned NOT NULL,
	`consultor_id` bigint unsigned NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`data` date,
	`valor` decimal(12,2) NOT NULL,
	`observacao` varchar(255),
	CONSTRAINT `despesas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `indicacoes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`recebedor_id` bigint unsigned NOT NULL,
	`indicado_id` bigint unsigned NOT NULL,
	`percentual` decimal(6,4) NOT NULL DEFAULT '0.0200',
	`observacao` varchar(255),
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `indicacoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `indicado_unico` UNIQUE(`indicado_id`)
);
--> statement-breakpoint
CREATE TABLE `lancamentos` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`periodo_id` bigint unsigned NOT NULL,
	`consultor_id` bigint unsigned NOT NULL,
	`empresa` enum('TRIUNI','AGV','SAFE_CLUB') NOT NULL,
	`faturamento` decimal(12,2),
	`comissao` decimal(12,2) NOT NULL,
	`placas` int NOT NULL DEFAULT 0,
	CONSTRAINT `lancamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notas_fiscais` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`periodo_id` bigint unsigned NOT NULL,
	`consultor_id` bigint unsigned NOT NULL,
	`emissor` enum('COOPERCAR_TRIUNI','SAFE_AGV') NOT NULL,
	`valor` decimal(12,2) NOT NULL,
	`status` enum('PENDENTE','ENVIADA','APROVADA','REPROVADA') NOT NULL DEFAULT 'PENDENTE',
	`numero` varchar(40),
	`arquivo` varchar(255),
	`enviada_em` datetime,
	`motivo_reprovacao` varchar(500),
	`avaliada_por` bigint unsigned,
	`avaliada_em` datetime,
	CONSTRAINT `notas_fiscais_id` PRIMARY KEY(`id`),
	CONSTRAINT `nota_unica` UNIQUE(`periodo_id`,`consultor_id`,`emissor`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`periodo_id` bigint unsigned NOT NULL,
	`consultor_id` bigint unsigned NOT NULL,
	`valor` decimal(12,2) NOT NULL,
	`pago_em` date NOT NULL,
	`comprovante` varchar(255),
	`registrado_por` bigint unsigned NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pagamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `pagamento_unico` UNIQUE(`periodo_id`,`consultor_id`)
);
--> statement-breakpoint
CREATE TABLE `periodos` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`mes` char(7) NOT NULL,
	`status` enum('ABERTO','FECHADO') NOT NULL DEFAULT 'ABERTO',
	`fechado_em` datetime,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `periodos_id` PRIMARY KEY(`id`),
	CONSTRAINT `mes_unico` UNIQUE(`mes`)
);
--> statement-breakpoint
CREATE TABLE `sessoes` (
	`id` char(64) NOT NULL,
	`usuario_id` bigint unsigned NOT NULL,
	`expira_em` datetime NOT NULL,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sga_linhas` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`periodo_id` bigint unsigned NOT NULL,
	`nome_sga` varchar(160) NOT NULL,
	`faturamento` decimal(12,2) NOT NULL,
	`placas` int NOT NULL DEFAULT 0,
	CONSTRAINT `sga_linhas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`nome` varchar(160) NOT NULL,
	`email` varchar(160) NOT NULL,
	`senha_hash` varchar(100) NOT NULL,
	`perfil` enum('ADMIN','FINANCEIRO','CONSULTOR') NOT NULL,
	`consultor_id` bigint unsigned,
	`ativo` boolean NOT NULL DEFAULT true,
	`trocar_senha` boolean NOT NULL DEFAULT true,
	`ultimo_acesso` datetime,
	`criado_em` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usuarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_unico` UNIQUE(`email`),
	CONSTRAINT `consultor_unico` UNIQUE(`consultor_id`)
);
--> statement-breakpoint
ALTER TABLE `apuracoes` ADD CONSTRAINT `apuracoes_periodo_id_periodos_id_fk` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apuracoes` ADD CONSTRAINT `apuracoes_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultor_nomes_sga` ADD CONSTRAINT `consultor_nomes_sga_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `despesas` ADD CONSTRAINT `despesas_periodo_id_periodos_id_fk` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `despesas` ADD CONSTRAINT `despesas_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `indicacoes` ADD CONSTRAINT `indicacoes_recebedor_id_consultores_id_fk` FOREIGN KEY (`recebedor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `indicacoes` ADD CONSTRAINT `indicacoes_indicado_id_consultores_id_fk` FOREIGN KEY (`indicado_id`) REFERENCES `consultores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lancamentos` ADD CONSTRAINT `lancamentos_periodo_id_periodos_id_fk` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lancamentos` ADD CONSTRAINT `lancamentos_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notas_fiscais` ADD CONSTRAINT `notas_fiscais_periodo_id_periodos_id_fk` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notas_fiscais` ADD CONSTRAINT `notas_fiscais_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notas_fiscais` ADD CONSTRAINT `notas_fiscais_avaliada_por_usuarios_id_fk` FOREIGN KEY (`avaliada_por`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_periodo_id_periodos_id_fk` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_registrado_por_usuarios_id_fk` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_usuario_id_usuarios_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sga_linhas` ADD CONSTRAINT `sga_linhas_periodo_id_periodos_id_fk` FOREIGN KEY (`periodo_id`) REFERENCES `periodos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_consultor_id_consultores_id_fk` FOREIGN KEY (`consultor_id`) REFERENCES `consultores`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `desp_periodo` ON `despesas` (`periodo_id`);--> statement-breakpoint
CREATE INDEX `recebedor` ON `indicacoes` (`recebedor_id`);--> statement-breakpoint
CREATE INDEX `lanc_periodo` ON `lancamentos` (`periodo_id`);--> statement-breakpoint
CREATE INDEX `sessao_usuario` ON `sessoes` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `sga_periodo` ON `sga_linhas` (`periodo_id`);