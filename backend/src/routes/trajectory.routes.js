const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const pool = require('../config/database');

// GET /api/trajectories - List all trajectories for current user
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM trajectories WHERE employee_id = $1 ORDER BY id DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get trajectories error:', error);
        res.status(500).json({ message: 'Failed to fetch trajectories' });
    }
});

// POST /api/trajectories - Create a new trajectory
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, start_location, end_location, km_single_trip, type } = req.body;

        if (!name || !start_location || !end_location || !km_single_trip || !type) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const result = await pool.query(
            `INSERT INTO trajectories (employee_id, name, start_location, end_location, km_single_trip, type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [req.user.id, name, start_location, end_location, km_single_trip, type]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create trajectory error:', error);
        res.status(500).json({ message: 'Failed to create trajectory: ' + error.message });
    }
});

// DELETE /api/trajectories/:id - Delete a trajectory
router.delete('/:id', authenticate, async (req, res) => {
    try {
        // Check if trajectory belongs to user
        const check = await pool.query(
            'SELECT id FROM trajectories WHERE id = $1 AND employee_id = $2',
            [req.params.id, req.user.id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Trajectory not found' });
        }

        await pool.query('DELETE FROM trajectories WHERE id = $1', [req.params.id]);
        res.json({ message: 'Trajectory deleted' });
    } catch (error) {
        console.error('Delete trajectory error:', error);
        res.status(500).json({ message: 'Failed to delete trajectory' });
    }
});

module.exports = router;
