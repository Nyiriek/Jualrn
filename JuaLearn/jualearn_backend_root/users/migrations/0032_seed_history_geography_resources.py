from django.db import migrations


HISTORY_SOURCE = 'Secondary History 4 Student Textbook (South Sudan, 2018)'
GEOGRAPHY_SOURCE = 'Secondary Geography 4 Student Textbook (South Sudan, 2017)'


COLLECTIONS = [
    (
        'History', HISTORY_SOURCE,
        [
            ('Unit 1: The Rise of the United States of America', 'pp. 1–32',
             'Trace how the United States changed from the Civil War era into a major political and economic power.',
             ['reconstruction after the Civil War', 'industrial growth, immigration and urbanisation', 'the federal system and checks and balances', 'the interwar period and the rise of superpower influence', 'social, artistic and technological developments'],
             ['reconstruction', 'industrialisation', 'immigration', 'federal government', 'isolationism', 'superpower'],
             'Use a cause-and-effect timeline: How did the Civil War, railways, industry and migration reshape the USA?',
             'In groups, build a four-part timeline. For each event, add one economic or political effect and explain the connection.',
             ['Name two changes that helped the USA industrialise after the Civil War.', 'How does a federal system share power?', 'Explain one reason the USA became more influential globally.']),
            ('Unit 2: Russian Revolution of 1917', 'pp. 33–58',
             'Examine conditions in Russia, the 1917 revolution, key leaders and the revolution’s effects in Europe and Africa.',
             ['Russia before 1917 and social inequality', 'political and economic causes of revolution', 'the stages of the 1917 revolution', 'Lenin, Stalin and Trotsky', 'long-term reforms and international effects'],
             ['Tsar', 'revolution', 'Bolshevik', 'communism', 'Soviet Union', 'reform'],
             'Sort evidence into political, social and economic causes before deciding which factors made revolution more likely.',
             'Create a cause–event–effect chain. Then compare the roles of Lenin, Stalin and Trotsky using evidence from the unit.',
             ['Give one political and one social cause of the revolution.', 'What was one major change brought by the revolution?', 'Why is it important to distinguish a cause from an effect?']),
            ('Unit 3: Colonisation and Independence in Latin America', 'pp. 59–71',
             'Explore Spanish and Portuguese rule in Latin America and the movements that challenged colonial control.',
             ['colonial administration and control', 'social groups and unequal power', 'reasons for independence movements', 'the leadership of Simón Bolívar', 'independence and its unfinished challenges'],
             ['colonisation', 'colony', 'independence', 'creole', 'liberation', 'Simón Bolívar'],
             'Use a map and social pyramid to identify who held power and who was excluded under colonial rule.',
             'Prepare a short evidence-based profile of Simón Bolívar: context, goal, action and historical significance.',
             ['Which European powers controlled much of Latin America?', 'Give two factors that encouraged independence movements.', 'How can a leader influence an independence movement?']),
            ('Unit 4: The Middle East', 'pp. 72–102',
             'Investigate how world wars, nationalism, oil, religion and foreign intervention shaped the modern Middle East.',
             ['the Middle East after World War I', 'World War II and the creation of Israel', 'Arab nationalism and the end of imperial rule', 'the Suez Crisis and OPEC', 'Sunni and Shia traditions and the Persian Gulf War'],
             ['mandate', 'nationalism', 'imperialism', 'nationalisation', 'OPEC', 'sect'],
             'Locate the region and identify why routes, oil resources and religious sites have made it strategically important.',
             'Compare two events from the unit using a table: causes, groups involved, immediate effects and long-term consequences.',
             ['What changed in the Middle East after World War I?', 'Why was control of the Suez Canal important?', 'Describe one purpose of OPEC.']),
            ('Unit 5: China and Japan', 'pp. 103–121',
             'Study conflict, revolution and changing world influence in China and Japan during the twentieth century.',
             ['Japanese invasion and occupation of China', 'the Chinese Civil War', 'the Communist Revolution', 'China’s emergence as a world power'],
             ['occupation', 'civil war', 'communist revolution', 'nationalist', 'ideology', 'world power'],
             'Begin with a timeline that separates invasion, civil war and revolution so that the events are not confused.',
             'Use a claim–evidence–reasoning paragraph to explain how conflict and revolution changed China’s position in the world.',
             ['What is the difference between an invasion and a civil war?', 'Name one consequence of the Chinese Civil War.', 'What evidence could show that a country has become a world power?']),
            ('Unit 6: World Organisations and the Promotion of Peace', 'pp. 122–136',
             'Evaluate why the League of Nations and the United Nations were formed, what they do and how they seek to promote peace.',
             ['origins and aims of the League of Nations', 'strengths and limits of collective security', 'creation and structure of the United Nations', 'peacekeeping, cooperation and human rights'],
             ['collective security', 'sanction', 'peacekeeping', 'Security Council', 'General Assembly', 'human rights'],
             'Ask: What can countries achieve together that is harder to achieve alone?',
             'Hold a small peace conference. Groups propose a response to a fictional border dispute using negotiation, mediation and international cooperation.',
             ['Why was the League of Nations created?', 'Name one difference between the League and the UN.', 'What does peacekeeping aim to achieve?']),
            ('Unit 7: The Organisation of African Unity and Modern Africa', 'pp. 137–165',
             'Explore African cooperation from the Organisation of African Unity to the African Union and compare development experiences.',
             ['formation and goals of the OAU', 'transition to the African Union', 'regional cooperation and African development', 'comparisons with development in Malaysia and India'],
             ['pan-Africanism', 'sovereignty', 'African Union', 'regional cooperation', 'development', 'integration'],
             'Start by listing cross-border challenges that a single country may not solve alone.',
             'Create an AU summit brief: identify one regional challenge, suggest a cooperative action and explain how progress could be measured.',
             ['What was one aim of the OAU?', 'Why was the African Union formed?', 'How can regional cooperation support development?']),
        ],
    ),
    (
        'Geography', GEOGRAPHY_SOURCE,
        [
            ('Unit 1: Globalization', 'pp. 2–24',
             'Explain how countries, people and businesses are increasingly connected through trade, culture, politics and technology.',
             ['economic, cultural, political and technological globalization', 'drivers including communication, trade and investment', 'positive and negative impacts', 'regional and global groupings'],
             ['globalization', 'interdependence', 'trade', 'investment', 'cultural erosion', 'regional grouping'],
             'Connect a familiar product, phone call or online service to the countries, people and resources involved.',
             'Classify real-life scenarios as economic, cultural, political or technological globalization. Defend one classification with evidence.',
             ['Define globalization in your own words.', 'Name two factors that encourage globalization.', 'Describe one benefit and one challenge of globalization.']),
            ('Unit 2: Seas and Oceans', 'pp. 25–60',
             'Investigate oceans, coasts, landforms, climate influence and sustainable management of marine environments.',
             ['distribution and importance of seas and oceans', 'waves, erosion and deposition at coasts', 'coastal landforms', 'ocean influence on global climate', 'sustainable use and protection'],
             ['ocean current', 'coast', 'erosion', 'deposition', 'tide', 'sustainability'],
             'Use a world map to locate major oceans and predict why coastal places may have different climates from inland places.',
             'Draw and label a coastal landform. Explain whether erosion or deposition formed it and how people can use or protect the coast.',
             ['What is one way oceans influence climate?', 'How are erosion and deposition different?', 'Give one action that supports sustainable ocean use.']),
            ('Unit 3: Coastal Areas', 'pp. 61–71',
             'Examine why coastal towns grow, how East African coastal towns develop and how coasts can be managed responsibly.',
             ['ports, trade, tourism and fishing', 'growth of East African coastal towns', 'benefits and pressures of development', 'coastal management strategies'],
             ['coastal town', 'port', 'tourism', 'fishing', 'erosion', 'coastal management'],
             'Compare a coastal town with an inland town: What opportunities and risks are different?',
             'Plan a coastal town council meeting. Balance jobs from tourism and trade with waste control, habitat protection and safety from erosion.',
             ['Why do many coastal towns develop near ports?', 'Name one coastal economic activity.', 'Why is coastal management needed?']),
            ('Unit 4: Global Energy Resources', 'pp. 72–89',
             'Compare renewable and non-renewable energy resources and evaluate patterns of global energy use.',
             ['energy needs and resource types', 'renewable sources such as solar, wind and hydro power', 'non-renewable fuels', 'uneven consumption and environmental impacts'],
             ['renewable', 'non-renewable', 'fossil fuel', 'hydropower', 'energy consumption', 'conservation'],
             'List the energy sources used at home, school or in transport and sort them into renewable and non-renewable groups.',
             'Design an energy plan for a community. Choose a mix of sources, explain costs and benefits, and include one way to reduce waste.',
             ['What makes an energy resource renewable?', 'Give one advantage and one limitation of solar energy.', 'Why does energy consumption differ between places?']),
            ('Unit 5: Rocks', 'pp. 90–110',
             'Study rock formation, properties, the rock cycle and weathering, including links between rocks, soil and landscapes.',
             ['what rocks are made of', 'igneous, sedimentary and metamorphic rocks', 'texture and composition', 'the rock cycle', 'physical, chemical and biological weathering'],
             ['mineral', 'igneous', 'sedimentary', 'metamorphic', 'weathering', 'rock cycle'],
             'Observe local stones or photographs. Describe colour, grain size, layers and hardness before naming any rock type.',
             'Build a labelled rock-cycle diagram. Add arrows and explain the process represented by each arrow.',
             ['Name the three main rock groups.', 'What process can turn sediment into sedimentary rock?', 'How is weathering different from erosion?']),
            ('Unit 6: Minerals and Mining', 'pp. 111–132',
             'Explore mineral distribution, mining of gold, diamonds and iron, their uses and the environmental and social decisions involved.',
             ['global mineral production', 'gold mining and uses', 'diamond mining and uses', 'iron mining and processing', 'responsible mining choices'],
             ['mineral', 'ore', 'mining', 'processing', 'extraction', 'rehabilitation'],
             'Consider the journey from an ore in the ground to a useful product. Identify the stages and people involved.',
             'Complete a mine-impact balance sheet with economic benefits, environmental risks and practical safeguards for workers and nearby communities.',
             ['What is an ore?', 'Name one use of gold, diamond or iron.', 'Why should mined land be rehabilitated?']),
            ('Unit 7: Regional Studies', 'pp. 133–154',
             'Compare the physical geography, settlement and economies of East Africa and other African regions.',
             ['East African physical geography', 'population distribution and settlement', 'economic activities', 'West, North and Southern African regions', 'regional comparison using maps and data'],
             ['region', 'relief', 'settlement', 'population density', 'economic activity', 'resource'],
             'Use an atlas or map to find patterns: mountains, rivers, climate zones, cities and transport routes.',
             'Create a regional profile card with location, physical features, population pattern, key activities and one comparison with another African region.',
             ['What is a region?', 'Give one factor that affects population distribution.', 'How can physical geography influence economic activity?']),
            ('Unit 8: Bridging the Development Gap', 'pp. 155–177',
             'Use development indicators to explain inequality and evaluate strategies for improving quality of life fairly and sustainably.',
             ['meaning and measurement of the development gap', 'GDP, GNI and other indicators', 'reasons gaps can grow', 'education, health, trade, aid and investment strategies'],
             ['development gap', 'GDP', 'GNI', 'indicator', 'inequality', 'sustainable development'],
             'Ask what a single income figure can show and what it can hide about people’s lives.',
             'Compare two fictional country profiles using several indicators. Recommend two actions to improve well-being and explain who should benefit.',
             ['What does the development gap describe?', 'Why is it helpful to use more than one development indicator?', 'Name one measure that may help reduce inequality.']),
            ('Unit 9: International Trade', 'pp. 178–189',
             'Explain why countries trade, how trade is organised and the role of the World Trade Organization.',
             ['meaning and patterns of international trade', 'imports, exports and trade links', 'benefits, costs and barriers to trade', 'the World Trade Organization'],
             ['international trade', 'import', 'export', 'tariff', 'trade balance', 'World Trade Organization'],
             'Trace one everyday item from producer to consumer, noting materials, transport, jobs and countries involved.',
             'Run a fair-trade negotiation. Groups represent producers, consumers and governments and agree rules that support jobs, prices and environmental care.',
             ['What is the difference between an import and an export?', 'Give one reason countries trade.', 'What is one role of the World Trade Organization?']),
        ],
    ),
]


def resource_content(summary, ideas, vocabulary, starter, activity, checks):
    return (
        f"Learning goal\n{summary}\n\n"
        f"Key ideas\n" + '\n'.join(f"• {idea}" for idea in ideas) + "\n\n"
        f"Key vocabulary\n" + ', '.join(vocabulary) + "\n\n"
        f"Lesson-ready flow\nStarter: {starter}\nExplore: Read the key ideas, then highlight a claim, example and question.\nCollaborate: {activity}\nExit check: {checks[0]}"
    )


def seed_history_geography_resources(apps, schema_editor):
    LearningResource = apps.get_model('users', 'LearningResource')
    for subject_area, source, units in COLLECTIONS:
        for title, pages, summary, ideas, vocabulary, starter, activity, checks in units:
            common = {
                'subject_area': subject_area,
                'topic': title,
                'source': source,
                'is_published': True,
            }
            entries = [
                (title, 'reading', f'{title}, {pages}', summary, resource_content(summary, ideas, vocabulary, starter, activity, checks)),
                (f'{title} — Concept notes', 'reading', f'{title}, {pages} · Concept notes',
                 'A concise, student-friendly explanation of the unit’s core ideas and vocabulary.',
                 f"Read and recall\n{summary}\n\nEssential ideas\n" + '\n'.join(f"• {idea}" for idea in ideas) + f"\n\nVocabulary challenge\nDefine these words in your own language, then use two correctly in a sentence: {', '.join(vocabulary)}.\n\nQuick check\n1. {checks[0]}\n2. {checks[1]}"),
                (f'{title} — Interactive investigation', 'activity', f'{title}, {pages} · Guided activity',
                 'A collaborative, evidence-based task that turns the topic into discussion and decision-making.',
                 f"Interactive investigation\n{activity}\n\nYour task\n1. Work with a partner or group.\n2. Use two ideas from the reading as evidence.\n3. Record one conclusion and one question your group still has.\n4. Share your conclusion and respond respectfully to another group.\n\nReflection\n{checks[2]}"),
                (f'{title} — Practice worksheet', 'worksheet', f'{title}, {pages} · Practice worksheet',
                 'Short retrieval, explanation and application prompts for independent study or class practice.',
                 f"Practice worksheet\n1. Recall: {checks[0]}\n2. Explain: {checks[1]}\n3. Apply: {checks[2]}\n\nSelf-check\nUnderline the topic vocabulary you used. Add one example from the lesson or your local context.\n\nExtension\nWrite one question you would ask a classmate to test their understanding."),
                (f'{title} — Lesson assessment', 'assessment', f'{title}, {pages} · Assessment prompt',
                 'A teacher-ready formative assessment with a clear, evidence-based response structure.',
                 f"Assessment task\nWrite a short response that answers this question: {checks[2]}\n\nSuccess criteria\n• Give a clear answer or claim.\n• Use at least two accurate terms: {', '.join(vocabulary[:3])}.\n• Include an example, reason or piece of evidence from the topic.\n• End with one sentence explaining why the idea matters.\n\nTeacher feedback focus\nCheck accuracy, use of evidence and clarity of explanation."),
                (f'{title} — Video study guide', 'video', f'{title}, {pages} · Video study guide',
                 'A low-data viewing guide for a teacher-selected video, map animation or documentary clip.',
                 f"Video study guide\nBefore viewing: {starter}\n\nWhile viewing\n• Note three ideas linked to: {', '.join(ideas[:3])}.\n• Pause to define one key word: {vocabulary[0]}.\n• Record one example or map detail.\n\nAfter viewing\nAnswer: {checks[1]}\nThen compare your answer with a partner and improve one sentence using evidence."),
            ]
            for resource_title, resource_type, source_reference, description, content in entries:
                LearningResource.objects.update_or_create(
                    title=resource_title,
                    source=source,
                    defaults={
                        **common,
                        'resource_type': resource_type,
                        'source_reference': source_reference[:100],
                        'description': description,
                        'content': content,
                    },
                )


def remove_history_geography_resources(apps, schema_editor):
    LearningResource = apps.get_model('users', 'LearningResource')
    LearningResource.objects.filter(source__in=[HISTORY_SOURCE, GEOGRAPHY_SOURCE]).delete()


class Migration(migrations.Migration):
    dependencies = [('users', '0031_separate_feedback_board')]

    operations = [migrations.RunPython(seed_history_geography_resources, remove_history_geography_resources)]
