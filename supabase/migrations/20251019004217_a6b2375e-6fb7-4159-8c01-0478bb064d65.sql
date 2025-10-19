-- Add placement test questions for different levels (with correct uppercase answers)
-- Nivel A1 (Beginner)
INSERT INTO placement_tests (question, option_a, option_b, option_c, option_d, correct_answer, level, question_number) VALUES
('¿Cómo _____ llamas?', 'te', 'se', 'me', 'le', 'A', 'A1', 1),
('Yo _____ de Estados Unidos.', 'es', 'soy', 'está', 'estoy', 'B', 'A1', 2),
('Ella _____ 25 años.', 'tiene', 'es', 'está', 'hay', 'A', 'A1', 3),
('¿_____ vives?', 'Dónde', 'Cuándo', 'Qué', 'Quién', 'A', 'A1', 4),
('Nosotros _____ español.', 'hablo', 'hablas', 'hablamos', 'hablan', 'C', 'A1', 5);

-- Nivel A2 (Elementary)
INSERT INTO placement_tests (question, option_a, option_b, option_c, option_d, correct_answer, level, question_number) VALUES
('Todos los días yo _____ a las 7 de la mañana.', 'me levanto', 'me levanta', 'levanto', 'levantarme', 'A', 'A2', 1),
('¿Qué _____ hacer los fines de semana?', 'te gusta', 'te gustan', 'le gusta', 'le gustan', 'A', 'A2', 2),
('Ayer _____ al cine con mis amigos.', 'voy', 'fui', 'iba', 'iré', 'B', 'A2', 3),
('Cuando _____ niño, jugaba mucho en el parque.', 'soy', 'fui', 'era', 'estaba', 'C', 'A2', 4),
('¿_____ has estado en España?', 'Ya', 'Todavía', 'Nunca', 'Alguna vez', 'D', 'A2', 5);

-- Nivel B1 (Intermediate)
INSERT INTO placement_tests (question, option_a, option_b, option_c, option_d, correct_answer, level, question_number) VALUES
('Si tuviera dinero, _____ un coche nuevo.', 'compro', 'compré', 'compraría', 'comprara', 'C', 'B1', 1),
('Me gustaría que tú _____ más temprano.', 'llegas', 'llegues', 'llegaras', 'llegar', 'C', 'B1', 2),
('Cuando _____ pequeña, siempre _____ con mis abuelos.', 'era/visitaba', 'fui/visité', 'era/visité', 'fui/visitaba', 'A', 'B1', 3),
('Es importante que nosotros _____ el medio ambiente.', 'cuidamos', 'cuidemos', 'cuidáramos', 'cuidar', 'B', 'B1', 4),
('_____ tres años que estudio español.', 'Hace', 'Desde', 'Por', 'Para', 'A', 'B1', 5);

-- Nivel B2 (Upper Intermediate)
INSERT INTO placement_tests (question, option_a, option_b, option_c, option_d, correct_answer, level, question_number) VALUES
('Si hubiera sabido la verdad, no _____ eso.', 'habría dicho', 'había dicho', 'dijera', 'diría', 'A', 'B2', 1),
('Dudo que él _____ la tarea para mañana.', 'termina', 'termine', 'terminara', 'haya terminado', 'D', 'B2', 2),
('_____ de que llegues, avísame.', 'Antes', 'Después', 'Tan pronto', 'En cuanto', 'C', 'B2', 3),
('Me molesta que la gente no _____ las reglas.', 'respeta', 'respete', 'respetara', 'ha respetado', 'B', 'B2', 4),
('El libro _____ estoy leyendo es muy interesante.', 'que', 'quien', 'cuyo', 'el cual', 'A', 'B2', 5);