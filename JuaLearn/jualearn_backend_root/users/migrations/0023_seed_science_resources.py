from django.db import migrations


def seed_science_resources(apps, schema_editor):
    LearningResource = apps.get_model('users', 'LearningResource')
    collections = [
        (
            'Chemistry',
            'Chemistry Student’s Book 4 (South Sudan)',
            [
                ('Unit 1: Ions and Gases', 'activity', 'Unit 1, pp. 1–10', 'Practical tests for cations, anions and common gases.', 'Learning focus: use standard reagents and observations to identify ions and gases safely. Suggested assessment: write a test plan that distinguishes two unknown solutions and explains the expected observations.'),
                ('Unit 2: Energy Changes in Chemical Reactions', 'reading', 'Unit 2, pp. 11–32', 'Enthalpy, exothermic and endothermic reactions, energy profiles and bond energies.', 'Learning focus: calculate and represent energy changes; compare energy release and absorption; explain activation energy. Suggested assessment: interpret an energy profile diagram and justify the reaction type.'),
                ('Unit 3: Kinetics, Equilibrium and Electrochemistry', 'activity', 'Unit 3, pp. 33–71', 'Collision theory, reaction rates, equilibrium, electrolysis and the role of water and electricity.', 'Learning focus: investigate factors affecting reaction rate; explain dynamic equilibrium; apply electrolysis concepts. Suggested assessment: design a fair test for one rate factor and analyse the results.'),
                ('Unit 4: Metals, Ores and Extraction', 'reading', 'Unit 4, pp. 72–101', 'Composition of ores, extraction of common metals and metallic properties.', 'Learning focus: connect a metal’s reactivity with its extraction method; compare sodium, aluminium, copper, iron, zinc and chromium. Suggested assessment: recommend an extraction approach for a named ore with reasons.'),
                ('Unit 5: Analytical Techniques and Structure', 'assessment', 'Unit 5, pp. 102–118', 'Chromatography and spectroscopic techniques for determining chemical structure.', 'Learning focus: select appropriate analytical techniques and interpret evidence from chromatography, infrared, NMR, UV and mass spectra. Suggested assessment: match a technique to a scientific question and explain why.'),
                ('Unit 6: Organic Chemistry', 'reading', 'Unit 6, pp. 119–215', 'Hydrocarbons, alcohols, acids, detergents, polymers, fibres, aldehydes and ketones.', 'Learning focus: classify organic compounds and relate structure to properties and uses. Suggested assessment: create a comparison table for two homologous series and write a short application explanation.'),
                ('Unit 7: Nuclear Chemistry', 'activity', 'Unit 7, pp. 216–225', 'Radiation types, fission, fusion, decay and medical applications of radioactivity.', 'Learning focus: distinguish radiation types, explain half-life and compare fission with fusion. Suggested assessment: produce a safety-aware case study of a medical radioactivity application.'),
            ],
        ),
        (
            'Biology',
            'Secondary Biology 4 Student Textbook (South Sudan)',
            [
                ('Unit 1: Photosynthesis and Respiration', 'activity', 'Unit 1, pp. 1–39', 'Biochemistry of photosynthesis and respiration, leaf adaptations and gaseous exchange.', 'Learning focus: compare photosynthesis and respiration; investigate limiting factors and leaf structure. Suggested assessment: plan a starch-test investigation and explain how its controls support the conclusion.'),
                ('Unit 2: Reproduction and Growth', 'reading', 'Unit 2, pp. 40–121', 'Plant and animal reproduction, growth, cell division, chromosomes, mitosis and meiosis.', 'Learning focus: describe reproductive processes and relate mitosis and meiosis to growth and inheritance. Suggested assessment: sequence a life-cycle or cell-division process and explain key changes.'),
                ('Unit 3: Co-ordination in Plants and Animals', 'activity', 'Unit 3, pp. 122–159', 'Plant responses, auxin, the nervous system, neurones, reflexes and endocrine control.', 'Learning focus: compare plant and animal coordination; explain reflex actions and chemical coordination. Suggested assessment: label a reflex arc and use it to explain a familiar response.'),
                ('Unit 4: Homeostasis', 'reading', 'Unit 4, pp. 160–185', 'Homeostasis, endocrine control and osmoregulation in plants and animals.', 'Learning focus: explain how organisms keep internal conditions stable. Suggested assessment: analyse a change in water balance or temperature and describe the corrective response.'),
                ('Unit 5: Genetics and Inheritance', 'assessment', 'Unit 5, pp. 186–234', 'Inheritance, monohybrid crosses, dominance patterns, variation, mutations, evolution and genetic engineering.', 'Learning focus: use genetic vocabulary and Punnett-style reasoning; connect variation and mutation to evolution. Suggested assessment: solve and explain a simple inheritance problem.'),
                ('Unit 6: Adaptation and Evolution', 'reading', 'Unit 6, pp. 235–256', 'Origins of life, natural selection, convergent and divergent evolution and adaptation.', 'Learning focus: explain natural selection and use evidence to compare evolutionary patterns. Suggested assessment: write a claim-evidence-reasoning response about an adaptation.'),
                ('Unit 7: Support and Movement', 'activity', 'Unit 7, pp. 257–293', 'Support and movement in plants and animals, including the mammalian skeleton.', 'Learning focus: relate structure to support and movement in organisms. Suggested assessment: compare plant support with a skeletal adaptation in an animal.'),
            ],
        ),
        (
            'Physics',
            'Secondary Physics 4 Student Textbook (South Sudan)',
            [
                ('Unit 1: Periodic Motion', 'activity', 'Unit 1, pp. 1–60', 'Circular motion and simple harmonic motion, including forces, oscillation and energy.', 'Learning focus: model circular and harmonic motion; derive relationships among period, frequency and angular velocity. Suggested assessment: solve a periodic-motion problem and explain each step.'),
                ('Unit 2: Newton’s Law of Gravitation', 'reading', 'Unit 2, pp. 61–78', 'Universal gravitation, Kepler’s laws and their applications.', 'Learning focus: apply Newton’s gravitation law and describe orbital motion using Kepler’s laws. Suggested assessment: explain an everyday or astronomical application using a diagram.'),
                ('Unit 3: Wave Behaviour', 'activity', 'Unit 3, pp. 79–122', 'Reflection, refraction, diffraction, interference, stationary waves, beats and polarisation.', 'Learning focus: predict and explain wave behaviour using diagrams and experiments. Suggested assessment: compare reflection, refraction and diffraction in a structured table.'),
                ('Unit 4: Electric Fields and Capacitance', 'reading', 'Unit 4, pp. 123–170', 'Electric fields, potential, charge distribution, capacitors and electrostatic applications.', 'Learning focus: interpret field patterns and explain capacitance, charging and discharging. Suggested assessment: annotate an electric-field diagram and calculate or justify a capacitance relationship.'),
                ('Unit 5: Magnetic Fields and Electromagnetic Induction', 'activity', 'Unit 5, pp. 171–226', 'Magnetic effects of current, motors, induction, transformers and generators.', 'Learning focus: investigate electromagnetism and apply induction principles to practical devices. Suggested assessment: explain how a transformer or generator works using energy-transfer language.'),
                ('Unit 6: Cathode Ray Tube', 'reading', 'Unit 6, pp. 251–274', 'Production and properties of cathode rays and the cathode ray oscilloscope.', 'Learning focus: describe cathode-ray behaviour and explain how an oscilloscope is used. Suggested assessment: label a CRO use case and interpret a simple trace.'),
                ('Unit 7: Radioactivity and Nuclear Energy', 'assessment', 'Unit 7, pp. 275–317', 'Radioactive decay, half-life, radiation properties, detectors, fission, fusion and applications.', 'Learning focus: compare radiation types and nuclear processes; use half-life reasoning safely and accurately. Suggested assessment: interpret a decay scenario and evaluate one application of radioactivity.'),
            ],
        ),
    ]

    for subject_area, source, entries in collections:
        for title, resource_type, source_reference, description, content in entries:
            LearningResource.objects.get_or_create(
                title=title,
                source=source,
                defaults={
                    'subject_area': subject_area,
                    'resource_type': resource_type,
                    'source_reference': source_reference,
                    'description': description,
                    'content': content,
                    'is_published': True,
                },
            )


def remove_science_resources(apps, schema_editor):
    LearningResource = apps.get_model('users', 'LearningResource')
    LearningResource.objects.filter(source__in=[
        'Chemistry Student’s Book 4 (South Sudan)',
        'Secondary Biology 4 Student Textbook (South Sudan)',
        'Secondary Physics 4 Student Textbook (South Sudan)',
    ]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0022_learningresource_quiz_resources_subject_resources'),
    ]

    operations = [
        migrations.RunPython(seed_science_resources, remove_science_resources),
    ]
