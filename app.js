if (document.getElementById('fractalForm')) {
    document.getElementById('fractalForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            width: parseInt(document.getElementById('width').value),
            height: parseInt(document.getElementById('height').value),
            left: parseFloat(document.getElementById('left').value),
            top: parseFloat(document.getElementById('top').value),
            horizontalSize: parseFloat(document.getElementById('horizontalSize').value),
            verticalSize: parseFloat(document.getElementById('verticalSize').value),
            affineCoefficients: parseInt(document.getElementById('affineCoefficients').value),
            samples: parseInt(document.getElementById('samples').value),
            iterPerSample: parseInt(document.getElementById('iterPerSample').value),
            symmetry: parseInt(document.getElementById('symmetry').value),
            gamma: parseFloat(document.getElementById('gamma').value),
            generatorType: document.getElementById('generatorType').value,
            transformations: Array.from(document.querySelectorAll('#transformations input:checked')).map(el => el.value),
            ImageProcessors: Array.from(document.querySelectorAll('#imageProcessors input:checked')).map(el => el.value),
            imageType: document.getElementById('imageType').value,
        };

        if (formData.transformations.length === 0) {
            formData.transformations.push('LINEAR');
        }

        if (formData.ImageProcessors.length === 0) {
            formData.ImageProcessors.push('GammaCorrection');
        }

        try {
            const response = await fetch('http://localhost:8080/api/fractals/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to generate fractal');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);

            const fractalImage = document.getElementById('fractalImage');
            fractalImage.src = imageUrl;
            fractalImage.style.display = 'block';

            const downloadLink = document.getElementById('downloadLink');
            downloadLink.href = imageUrl;
            downloadLink.download = `fractal.${formData.imageType.toLowerCase()}`;
            downloadLink.style.display = 'block';

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate fractal. Check the console for details.');
        }
    });
}


if (document.getElementById('analyzeButton')) {
    document.getElementById('analyzeButton').addEventListener('click', async () => {
        const canvas = document.getElementById('analysisChart');
        const ctx = canvas.getContext('2d');

        if (window.analysisChart instanceof Chart) {
            window.analysisChart.destroy();
        }

        try {
            const response = await fetch('http://localhost:8080/api/analysis/data');
            if (!response.ok) {
                throw new Error('Failed to fetch graph data');
            }

            const { singleThreaded, multiThreaded } = await response.json();

            if (!singleThreaded || !multiThreaded) {
                throw new Error('No data available for chart generation.');
            }

            const singleThreadedPoints = singleThreaded.map(point => ({ x: point.iterations, y: point.timeTaken }));
            const multiThreadedPoints = multiThreaded.map(point => ({ x: point.iterations, y: point.timeTaken }));

            window.analysisChart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [
                        {
                            label: 'Multi-Threaded',
                            data: multiThreadedPoints.sort((a, b) => a.x - b.x),
                            borderColor: 'blue',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            pointRadius: 3,
                        },
                        {
                            label: 'Single-Threaded',
                            data: singleThreadedPoints.sort((a, b) => a.x - b.x),
                            borderColor: 'orange',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.3,
                            pointRadius: 3,
                        },
                    ],
                },
                options: {
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'Iterations',
                            },
                            ticks: {
                                callback: (value) => value.toLocaleString(),
                            },
                        },
                        y: {
                            type: 'logarithmic',
                            title: {
                                display: true,
                                text: 'Time Taken (ms)',
                            },
                            min: 1,
                            ticks: {
                                callback: (value) => value.toLocaleString(),
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const { x, y } = context.raw;
                                    return `Iterations: ${x}, Time: ${y} ms`;
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error('Error generating chart:', error);
            alert('Error generating chart. Check the console for details.');
        }
    });
}
